import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export async function GET(req: NextRequest) {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ["PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"] },
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            include: {
                items: {
                    take: 1,
                    include: {
                        product: {
                            select: {
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        name: true,
                        district: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        const cities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Konya", "Adana", "Gaziantep"];
        const anonymize = (name: string | null): string => {
            if (!name) return "Müşteri";
            const parts = name.split(" ");
            if (parts.length > 1) {
                return `${parts[0]} ${parts[1][0]}.`;
            }
            return name.length > 3 ? `${name.substring(0, 3)}***` : name;
        };

        const purchases = orders.map((order: typeof orders[number]) => {
            const item = order.items[0];
            return {
                id: order.id,
                productName: item?.product?.name || "Ürün",
                productImage: item?.product?.image || null,
                buyerName: anonymize(order.user?.name ?? null),
                city: order.user?.district?.name || cities[Math.floor(Math.random() * cities.length)],
                timeAgo: formatDistanceToNow(order.createdAt, { addSuffix: true, locale: tr }),
            };
        });

        return NextResponse.json({ purchases });
    } catch (error: any) {
        console.error("Recent purchases error:", error);
        return NextResponse.json({ purchases: [] });
    }
}
