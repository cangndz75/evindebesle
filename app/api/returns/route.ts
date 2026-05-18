import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { createAdminNotification } from "@/lib/admin-notification";
import { sendTransactionalEmail } from "@/lib/email/transactional";
import { getShipinkToken, createShipinkOrder, createReturnShipment } from "@/lib/shipinkService";

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

        // Shipink: token al → sipariş oluştur → iade etiketi kes
        let shipinkOrderId: string | null = null;
        let cargoTrackingCode: string | null = null;
        let cargoTrackingUrl: string | null = null;
        let cargoPdfUrl: string | null = null;

        try {
            const token = await getShipinkToken();

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
                (sum: number, i: any) => sum + i.price * i.quantity, 0
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

            shipinkOrderId = await createShipinkOrder(token, orderPayload);

            const packagePayload = [
                { dimension_unit: "cm", height: 5, length: 30, width: 20, weight: 1, weight_unit: "kg" },
            ];
            const shipmentResult = await createReturnShipment(token, shipinkOrderId, packagePayload);

            cargoPdfUrl = shipmentResult?.document?.labels?.[0]?.pdf || null;
            cargoTrackingUrl = shipmentResult?.tracking?.url || null;
            cargoTrackingCode = shipmentResult?.carrier?.shipment_id || null;
        } catch (shipinkError: any) {
            console.error("[RETURNS_POST_SHIPINK]", shipinkError);
            // Shipink başarısız olursa fallback olarak dummy kod üret, iade talebi yine oluşsun
            cargoTrackingCode = `DV-IADE-${Date.now().toString(36).toUpperCase()}`;
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
