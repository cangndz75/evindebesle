import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";

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
            const emailContent = `
                <h2>Sepetiniz Sizi Bekliyor!</h2>
                <p>Merhaba, sepetinizde unuttuğunuz ürünler olduğunu fark ettik.</p>
                <p>Alışverişinizi tamamlamanız için size özel indirim kodu tanımladık: <strong>${couponCode}</strong></p>
                <p>Bu kod ile %10 indirim kazanın.</p>
                <a href="${checkoutUrl}" style="background: #111; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Alışverişi Tamamla</a>
                <p>Sipariş ID: ${order.id}</p>
            `;

            const { error } = await resend.emails.send({
                from: "Dark Velvet <newsletter@evindebesle.com>",
                to: order.email!,
                subject: "Sepetinizde Size Özel Bir Teklif Var!",
                html: emailContent,
            });

            if (!error) {
                await prisma.emailLog.create({
                    data: {
                        userId: order.userId || "guest",
                        subject: "Abandoned Cart Recovery",
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
