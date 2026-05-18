import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/transactional";

export async function GET(req: NextRequest) {
    try {

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

        const abandonedOrders = await prisma.order.findMany({
            where: {
                status: "PENDING_PAYMENT",
                createdAt: {
                    lte: oneHourAgo,
                    gte: fourHoursAgo,
                },
                email: { not: null },
            },
            include: { user: true, items: true },
        });

        const results = [];

        for (const order of abandonedOrders) {
            const alreadySent = await prisma.emailLog.findFirst({
                where: {
                    userId: order.userId || "guest",
                    type: "ABANDONED_CART",
                    sentAt: { gte: fourHoursAgo },
                    content: { contains: order.id } // Track per order
                },
            });

            if (alreadySent) continue;

            const couponCode = `WELCOME10-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            const coupon = await prisma.coupon.create({
                data: {
                    code: couponCode,
                    description: "Abandoned Cart Recovery",
                    discountType: "PERCENT",
                    value: 10,
                    maxUsage: 1,
                    expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours
                    isActive: true,
                },
            });

            const checkoutUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?orderId=${order.id}`;

            const { error } = await sendTransactionalEmail({
                to: order.email!,
                type: "ABANDONED_CHECKOUT_REMINDER",
                payload: {
                    checkoutUrl,
                    couponCode,
                    orderIdShort: order.id.slice(0, 12),
                },
            });

            if (!error) {
                await prisma.emailLog.create({
                    data: {
                        userId: order.userId || "guest",
                        subject: "Ödeme hatırlatması — sepetiniz açık",
                        content: `Order: ${order.id}, Coupon: ${couponCode}`,
                        type: "ABANDONED_CART",
                        success: true,
                    }
                });
                results.push({ orderId: order.id, status: "sent" });
            } else {
                results.push({ orderId: order.id, status: "error", error });
            }
        }

        return NextResponse.json({ processed: abandonedOrders.length, results });

    } catch (error: any) {
        console.error("Abandoned Cart Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
