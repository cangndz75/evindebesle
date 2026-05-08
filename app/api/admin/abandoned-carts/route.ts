import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { subDays, subHours } from "date-fns";

const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;

const getTurkeyDayStartUtc = (date: Date) => {
    const shifted = new Date(date.getTime() + TURKEY_OFFSET_MS);
    shifted.setUTCHours(0, 0, 0, 0);
    return new Date(shifted.getTime() - TURKEY_OFFSET_MS);
};

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

        const abandonedCartsToday = await prisma.cartItem.groupBy({
            by: ["userId"],
            where: {
                updatedAt: { gte: twentyFourHoursAgo }
            },
            _count: { userId: true },
            _sum: { quantity: true }
        });

        const abandonedCartsWeek = await prisma.cartItem.groupBy({
            by: ["userId"],
            where: {
                updatedAt: { gte: sevenDaysAgo }
            },
            _count: { userId: true },
            _sum: { quantity: true }
        });

        const abandonedCartsMonth = await prisma.cartItem.groupBy({
            by: ["userId"],
            where: {
                updatedAt: { gte: thirtyDaysAgo }
            },
            _count: { userId: true },
            _sum: { quantity: true }
        });

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
                        marketingEmailConsent: true,
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

        const totalPotentialRevenue = abandonedCartsList.reduce(
            (sum: number, cart: any) => sum + cart.totalValue, 0
        );

        const productStats: Record<
            string,
            {
                product: any;
                quantity: number;
                value: number;
                lastUpdated: Date;
                usersById: Record<string, {
                    id: string;
                    name: string | null;
                    email: string;
                    image: string | null;
                    marketingEmailConsent: boolean;
                }>;
            }
        > = {};

        for (const item of detailedCarts) {
            const productId = item.product.id;
            if (!productStats[productId]) {
                productStats[productId] = {
                    product: item.product,
                    quantity: 0,
                    value: 0,
                    lastUpdated: item.updatedAt,
                    usersById: {},
                };
            }

            productStats[productId].quantity += item.quantity;
            productStats[productId].value += item.product.price * item.quantity;

            if (item.updatedAt > productStats[productId].lastUpdated) {
                productStats[productId].lastUpdated = item.updatedAt;
            }

            if (item.userId && item.user) {
                productStats[productId].usersById[item.userId] = {
                    id: item.user.id,
                    name: item.user.name,
                    email: item.user.email,
                    image: item.user.image,
                    marketingEmailConsent: Boolean(item.user.marketingEmailConsent),
                };
            }
        }

        const abandonedProducts = Object.values(productStats)
            .map((entry) => {
                const users = Object.values(entry.usersById);
                const consentedUsersCount = users.filter((u) => u.marketingEmailConsent).length;
                const nonConsentedUsersCount = users.length - consentedUsersCount;
                return {
                    product: entry.product,
                    quantity: entry.quantity,
                    value: entry.value,
                    users,
                    usersCount: users.length,
                    consentedUsersCount,
                    nonConsentedUsersCount,
                    lastUpdated: entry.lastUpdated.toISOString(),
                };
            })
            .sort((a, b) => b.value - a.value);

        const topAbandonedProducts = abandonedProducts
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10)
            .map((entry) => ({
                product: entry.product,
                count: entry.quantity,
                value: entry.value,
            }));

        const dailyTrend = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = getTurkeyDayStartUtc(subDays(now, i));
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const count = await prisma.cartItem.groupBy({
                by: ["userId"],
                where: {
                    updatedAt: { gte: dayStart, lt: dayEnd }
                },
            });

            dailyTrend.push({
                date: dayStart.toISOString(),
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
            abandonedProducts: abandonedProducts.slice(0, 100),
            topAbandonedProducts,
            dailyTrend,
        });
    } catch (error: any) {
        console.error("Abandoned carts error:", error);
        return NextResponse.json(
            { error: "Terk edilen sepet verileri yüklenirken hata oluştu." },
            { status: 500 }
        );
    }
}
