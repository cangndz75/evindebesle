import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { createAdminNotification } from "@/lib/admin-notification";
import { sendTransactionalEmail } from "@/lib/email/transactional";
import { getShipinkToken, createShipinkOrder, createReturnShipment } from "@/lib/shipinkService";
import { getReturnReferenceDate, getReturnWindowDays, isReturnWindowOpen } from "@/lib/returnWindow";
import { sendTelegramMessage, TelegramTemplates } from "@/lib/telegramService";

const RETURN_CARGO_COMPANY = process.env.RETURN_CARGO_COMPANY || "Shipink Kargo";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authConfig);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const returns = await prisma.returnRequest.findMany({
            where: {
                userId: session.user.id,
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

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authConfig);

        if (!session?.user?.id) {
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
                userId: session.user.id,
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

        // Shipink: (1) sipariş oluştur → shipinkOrderId (2) iade gönderisi / etiket
        let shipinkOrderId: string | null = null;
        let cargoTrackingCode: string | null = null;
        let cargoTrackingUrl: string | null = null;
        let cargoPdfUrl: string | null = null;

        const shippingAddr = order.shippingAddress as any;
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

        const orderPayload = {
            customer: {
                name: order.user?.name || "",
                email: { main: order.user?.email || "", work: "" },
                phone: { main: order.user?.phone || "", work: "", cell: "", code: "" },
                address: {
                    street: shippingAddr?.fullAddress || "",
                    city: shippingAddr?.district?.city || "",
                    state: shippingAddr?.district?.city || "",
                    zip: shippingAddr?.postalCode || "",
                    country_code: "TR",
                },
            },
            items: returnItemsForShipink,
            currency: "TRY",
            price: totalRefundAmount,
            payment: { method: "credit-card", status: "completed" },
        };

        const packagePayload = [
            { dimension_unit: "cm", height: 5, length: 30, width: 20, weight: 1, weight_unit: "kg" },
        ];

        try {
            const token = await getShipinkToken();

            // 1) Shipink siparişi — başarılıysa shipinkOrderId dolar (kısmi başarı senaryosu için kritik)
            shipinkOrderId = await createShipinkOrder(token, orderPayload);

            // 2) İade gönderisi / etiket — hata çoğunlukla bu adımda; shipinkOrderId yine de korunur
            const shipmentResult = await createReturnShipment(token, shipinkOrderId, packagePayload);

            cargoTrackingCode = shipmentResult?.carrier?.shipment_id || null;
            cargoPdfUrl = shipmentResult?.document?.labels?.[0]?.pdf || null;
            cargoTrackingUrl = shipmentResult?.tracking?.url || null;
        } catch (shipinkError: unknown) {
            console.error(
                "Shipink entegrasyon hatası (müşteri yedek kodu ile devam edebilir):",
                shipinkError
            );

            /**
             * EDGE CASE — kısmi başarı:
             * Hata fırlatıldığında `shipinkOrderId` doluysa sipariş Shipink'e yazılmış ancak gönderi/etiket
             * tamamlanamamış olabilir. Bu ID'yi sıfırlamıyoruz; admin Shipink panelinden manuel ilerleyebilir.
             * Müşteri mağdur olmasın diye yalnızca `cargoTrackingCode` boşsa yerel yedek kod üretilir.
             */
            if (!cargoTrackingCode) {
                cargoTrackingCode = `DV-IADE-${Date.now().toString(36).toUpperCase()}`;
            }
        }

        const returnRequest = await prisma.$transaction(async (tx: any) => {
            const rr = await tx.returnRequest.create({
                data: {
                    orderId,
                    userId: session.user.id,
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
