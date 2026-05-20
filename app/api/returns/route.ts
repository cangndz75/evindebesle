import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createAdminNotification } from "@/lib/admin-notification";
import { sendTransactionalEmail } from "@/lib/email/transactional";
import { getShipinkToken, createShipinkOrder, createReturnShipment } from "@/lib/shipinkService";
import { buildShipinkCustomerBlock } from "@/lib/shipink-customer-address";
import { isBasitKargoConfigured, createOrderWithBarcode, type BasitKargoOrderPayload } from "@/lib/basitkargoService";
import { getReturnReferenceDate, getReturnWindowDays, isReturnWindowOpen } from "@/lib/returnWindow";
import { sendTelegramMessage, TelegramTemplates } from "@/lib/telegramService";

const RETURN_CARGO_COMPANY = process.env.RETURN_CARGO_COMPANY || "Shipink Kargo";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const returns = await prisma.returnRequest.findMany({
            where: {
                userId: user.id,
            },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                    },
                },
                items: {
                    include: {
                        orderItem: {
                            select: {
                                productName: true,
                                colorName: true,
                                sizeName: true,
                                image: true,
                                unitPrice: true,
                                totalPrice: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(returns);
    } catch (error) {
        console.error("[RETURNS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { orderId, reason, description, images, items } = body;

        if (!orderId || !reason || !items || items.length === 0) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
                userId: user.id,
            },
            include: {
                items: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                shippingAddress: {
                    include: {
                        district: true,
                    },
                },
                billingAddress: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        if (!order) {
            return new NextResponse("Order not found", { status: 404 });
        }

        if (order.status !== "DELIVERED" && order.status !== "COMPLETED") {
            return new NextResponse("Only delivered orders can be returned", { status: 400 });
        }

        const returnRef = getReturnReferenceDate({
            deliveredAt: order.deliveredAt,
            shippedAt: order.shippedAt,
            paidAt: order.paidAt,
        });
        if (returnRef && !isReturnWindowOpen(returnRef)) {
            return new NextResponse(
                `İade süresi doldu. Teslim veya ödeme tarihinden itibaren en fazla ${getReturnWindowDays()} gün içinde talep oluşturabilirsiniz.`,
                { status: 400 }
            );
        }

        const existingReturn = await prisma.returnRequest.findFirst({
            where: { orderId },
        });

        if (existingReturn) {
            return new NextResponse("A return request already exists for this order", { status: 400 });
        }

        const orderItemIds = order.items.map((item: { id: string }) => item.id);
        for (const item of items as { orderItemId: string; quantity: number; reason?: string }[]) {
            if (!orderItemIds.includes(item.orderItemId)) {
                return new NextResponse("Invalid order item", { status: 400 });
            }
        }

        let shipinkOrderId: string | null = null;
        let cargoTrackingCode: string | null = null;
        let cargoTrackingUrl: string | null = null;
        let cargoPdfUrl: string | null = null;

        const shippingAddr = order.shippingAddress as any;

        try {
            if (isBasitKargoConfigured()) {
                // ─── BasitKargo: INCOMING sipariş + barkod ───
                const districtName = shippingAddr?.district?.name || "";
                const cityName = shippingAddr?.district?.city || "";

                const bkPayload: BasitKargoOrderPayload = {
                    handlerCode: "ECONOMIC",
                    type: "INCOMING",
                    content: {
                        name: `İade #${order.orderNumber}`,
                        code: order.orderNumber,
                        items: (items as any[]).map((ri) => {
                            const oi = order.items.find((o: any) => o.id === ri.orderItemId) as any;
                            return { name: oi?.productName || "Ürün", quantity: String(ri.quantity) };
                        }),
                        packages: [{ height: 5, width: 20, depth: 30, weight: 1 }],
                    },
                    client: {
                        name: order.user?.name || "Müşteri",
                        phone: order.user?.phone || "",
                        city: cityName,
                        town: districtName,
                        address: shippingAddr?.fullAddress || "",
                    },
                };

                const bkResult = await createOrderWithBarcode(bkPayload);
                shipinkOrderId = bkResult.id;
                cargoTrackingCode = bkResult.barcode || null;
            } else {
                // ─── Shipink: (1) sipariş oluştur (2) iade gönderisi ───
                const returnItemsForShipink = (items as any[]).map((ri) => {
                    const oi = order.items.find((o: any) => o.id === ri.orderItemId) as any;
                    return {
                        name: oi?.productName || "Ürün",
                        quantity: ri.quantity,
                        price: Number(oi?.unitPrice ?? 0),
                        category: "clothing",
                    };
                });
                const totalRefundAmount = returnItemsForShipink.reduce(
                    (sum: number, i: any) => sum + i.price * i.quantity,
                    0
                );

                const shipinkPayload = {
                    customer: buildShipinkCustomerBlock({
                        user: order.user,
                        shippingAddress: shippingAddr,
                    }),
                    items: returnItemsForShipink,
                    currency: "TRY",
                    price: totalRefundAmount,
                    payment: { method: "credit-card", status: "completed" },
                };

                const packagePayload = [
                    { dimension_unit: "cm", height: 5, length: 30, width: 20, weight: 1, weight_unit: "kg" },
                ];

                const token = await getShipinkToken();
                shipinkOrderId = await createShipinkOrder(token, shipinkPayload);

                const shipmentResult = await createReturnShipment(token, shipinkOrderId, packagePayload);
                cargoTrackingCode = shipmentResult?.carrier?.shipment_id || null;
                cargoPdfUrl = shipmentResult?.document?.labels?.[0]?.pdf || null;
                cargoTrackingUrl = shipmentResult?.tracking?.url || null;
            }
        } catch (cargoError: unknown) {
            console.error("[RETURN_CARGO_ERROR] Yedek kod ile devam:", cargoError);

            if (!cargoTrackingCode) {
                cargoTrackingCode = `DV-IADE-${Date.now().toString(36).toUpperCase()}`;
            }
        }

        const returnRequest = await prisma.$transaction(async (tx: any) => {
            const rr = await tx.returnRequest.create({
                data: {
                    orderId,
                    userId: user.id,
                    reason,
                    description: description || null,
                    images: images || [],
                    status: "PENDING",
                    cargoTrackingCode,
                    cargoTrackingUrl,
                    cargoPdfUrl,
                    shipinkOrderId,
                    items: {
                        create: items.map((item: { orderItemId: string; quantity: number; reason?: string }) => ({
                            orderItemId: item.orderItemId,
                            quantity: item.quantity,
                            reason: item.reason || null,
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });

            await tx.order.update({
                where: { id: orderId },
                data: { status: "RETURN_REQUESTED" },
            });

            return rr;
        });

        await createAdminNotification({
            type: "RETURN",
            title: "Yeni İade Talebi",
            message: `#${order.orderNumber} numaralı sipariş için iade talebi oluşturuldu. İncelemek için İadeler sayfasına gidin.`,
            link: `/admin-returns?returnId=${returnRequest.id}`,
        });

        sendTelegramMessage(TelegramTemplates.newReturn({
            orderNumber: order.orderNumber,
            customerName: order.user?.name || "Müşteri",
            reason,
            itemsCount: items.length,
        })).catch((err) => console.error("[RETURN_TELEGRAM]", err));

        const to =
            order.email ||
            order.user?.email ||
            order.shippingAddress?.email ||
            order.billingAddress?.email ||
            null;

        if (to) {
            await sendTransactionalEmail({
                to,
                type: "RETURN_REQUEST_CREATED",
                payload: {
                    orderNumber: order.orderNumber,
                    carrierName: RETURN_CARGO_COMPANY,
                    trackingCode: cargoTrackingCode,
                    pdfUrl: cargoPdfUrl,
                    trackingUrl: cargoTrackingUrl,
                },
            }).catch((mailError) => {
                console.error("[RETURNS_POST_MAIL]", mailError);
            });
        }

        return NextResponse.json({
            ...returnRequest,
            cargoTrackingCode,
            cargoTrackingUrl,
            cargoPdfUrl,
            shipinkOrderId,
            cargoCompany: RETURN_CARGO_COMPANY,
        });
    } catch (error) {
        console.error("[RETURNS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
