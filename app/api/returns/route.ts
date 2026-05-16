import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { createAdminNotification } from "@/lib/admin-notification";
import { resend, resendFromAddress } from "@/lib/resend";

const RETURN_CARGO_CODE = process.env.RETURN_CARGO_CODE || "DV-IADE-2026";
const RETURN_CARGO_COMPANY = process.env.RETURN_CARGO_COMPANY || "Yurtiçi Kargo";

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
                    },
                },
                shippingAddress: {
                    select: {
                        email: true,
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

        const cargoTrackingCode = `${RETURN_CARGO_CODE}-${Date.now().toString(36).toUpperCase()}`;

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
            await resend.emails
                .send({
                    from: resendFromAddress(),
                    to,
                    subject: `İade talebiniz oluşturuldu - ${order.orderNumber}`,
                    html: `
                      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:600px;margin:0 auto">
                        <h2>İade Talebiniz Oluşturuldu</h2>
                        <p>Sipariş No: <strong>${order.orderNumber}</strong></p>
                        <p>İade talebiniz başarıyla alınmıştır.</p>
                        <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #eee">
                          <h3 style="margin:0 0 8px;font-size:15px">Kargo Bilgileri</h3>
                          <p style="margin:4px 0"><strong>Kargo Firması:</strong> ${RETURN_CARGO_COMPANY}</p>
                          <p style="margin:4px 0"><strong>İade Kargo Kodu:</strong> ${cargoTrackingCode}</p>
                          <p style="margin:8px 0 0;font-size:13px;color:#666">Ürünü yukarıdaki kodla ${RETURN_CARGO_COMPANY}'ye ücretsiz olarak teslim edebilirsiniz.</p>
                        </div>
                        <p>Süreci Hesabım &gt; Siparişlerim ekranından takip edebilirsiniz.</p>
                        <p style="color:#666;font-size:13px;margin-top:24px">Dark Velvet</p>
                      </div>
                    `,
                })
                .catch((mailError) => {
                    console.error("[RETURNS_POST_MAIL]", mailError);
                });
        }

        return NextResponse.json({
            ...returnRequest,
            cargoTrackingCode,
            cargoCompany: RETURN_CARGO_COMPANY,
        });
    } catch (error) {
        console.error("[RETURNS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
