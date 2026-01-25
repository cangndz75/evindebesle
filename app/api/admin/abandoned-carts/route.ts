import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { subDays, subHours, format } from "date-fns";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authConfig);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
        }

        const now = new Date();
        const twentyFourHoursAgo = subHours(now, 24);
        const sevenDaysAgo = subDays(now, 7);
        const thirtyDaysAgo = subDays(now, 30);

        // Terk edilen sepetler - son 24 saat
        const abandonedCartsToday = await prisma.cartItem.groupBy({
            by: ["userId"],
            where: {
                updatedAt: { gte: twentyFourHoursAgo }
            },
            _count: { userId: true },
            _sum: { quantity: true }
        });

        // Son 7 gün
        const abandonedCartsWeek = await prisma.cartItem.groupBy({
            by: ["userId"],
            where: {
                updatedAt: { gte: sevenDaysAgo }
            },
            _count: { userId: true },
            _sum: { quantity: true }
        });

        // Son 30 gün
        const abandonedCartsMonth = await prisma.cartItem.groupBy({
            by: ["userId"],
            where: {
                updatedAt: { gte: thirtyDaysAgo }
            },
            _count: { userId: true },
            _sum: { quantity: true }
        });

        // Detaylı sepet verileri - kullanıcı bilgileriyle
        const detailedCarts = await prisma.cartItem.findMany({
            where: {
                updatedAt: { gte: sevenDaysAgo }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        createdAt: true,
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true,
                    }
                },
                size: {
                    select: {
                        name: true,
                    }
                },
                color: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: { updatedAt: "desc" },
            take: 100,
        });

        // Kullanıcı bazlı gruplama
        const userCarts: Record<string, any> = {};
        for (const item of detailedCarts) {
            if (!item.userId) continue;

            if (!userCarts[item.userId]) {
                userCarts[item.userId] = {
                    user: item.user,
                    items: [],
                    totalValue: 0,
                    itemCount: 0,
                    lastUpdated: item.updatedAt,
                };
            }

            userCarts[item.userId].items.push({
                product: item.product,
                quantity: item.quantity,
                size: item.size?.name,
                color: item.color?.name,
                value: item.product.price * item.quantity,
            });

            userCarts[item.userId].totalValue += item.product.price * item.quantity;
            userCarts[item.userId].itemCount += item.quantity;

            if (item.updatedAt > userCarts[item.userId].lastUpdated) {
                userCarts[item.userId].lastUpdated = item.updatedAt;
            }
        }

        const abandonedCartsList = Object.values(userCarts).sort(
            (a: any, b: any) => b.totalValue - a.totalValue
        );

        // Toplam potansiyel gelir
        const totalPotentialRevenue = abandonedCartsList.reduce(
            (sum: number, cart: any) => sum + cart.totalValue, 0
        );

        // En çok terk edilen ürünler
        const productCounts: Record<string, { product: any; count: number; value: number }> = {};
        for (const item of detailedCarts) {
            const productId = item.product.id;
            if (!productCounts[productId]) {
                productCounts[productId] = {
                    product: item.product,
                    count: 0,
                    value: 0,
                };
            }
            productCounts[productId].count += item.quantity;
            productCounts[productId].value += item.product.price * item.quantity;
        }

        const topAbandonedProducts = Object.values(productCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Günlük trend (son 7 gün)
        const dailyTrend = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = subDays(now, i);
            const dayEnd = subDays(now, i - 1);

            const count = await prisma.cartItem.groupBy({
                by: ["userId"],
                where: {
                    updatedAt: { gte: dayStart, lt: dayEnd }
                },
            });

            dailyTrend.push({
                date: format(dayStart, "dd MMM"),
                count: count.length,
            });
        }

        return NextResponse.json({
            summary: {
                today: {
                    users: abandonedCartsToday.length,
                    items: abandonedCartsToday.reduce((sum: number, c: { _sum: { quantity: number | null } }) => sum + (c._sum.quantity || 0), 0),
                },
                week: {
                    users: abandonedCartsWeek.length,
                    items: abandonedCartsWeek.reduce((sum: number, c: { _sum: { quantity: number | null } }) => sum + (c._sum.quantity || 0), 0),
                },
                month: {
                    users: abandonedCartsMonth.length,
                    items: abandonedCartsMonth.reduce((sum: number, c: { _sum: { quantity: number | null } }) => sum + (c._sum.quantity || 0), 0),
                },
                totalPotentialRevenue,
            },
            abandonedCarts: abandonedCartsList.slice(0, 50),
            topAbandonedProducts,
            dailyTrend,
        });
    } catch (error: any) {
        console.error("Abandoned carts error:", error);
        return NextResponse.json(
            { error: error.message || "Terk edilen sepet verileri yüklenirken hata oluştu" },
            { status: 500 }
        );
    }
}
