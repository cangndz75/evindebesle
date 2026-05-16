import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true },
        });

        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get("status");
        const countOnly = searchParams.get("countOnly");

        const where: any = {};
        if (statusFilter && statusFilter !== "ALL") {
            where.status = statusFilter;
        }

        if (countOnly === "true") {
            const counts = await prisma.returnRequest.groupBy({
                by: ["status"],
                _count: { id: true },
            });
            const countMap: Record<string, number> = {};
            let total = 0;
            for (const c of counts) {
                countMap[c.status] = c._count.id;
                total += c._count.id;
            }
            const pendingAction =
                (countMap.PENDING ?? 0) + (countMap.RECEIVED ?? 0);
            return NextResponse.json({ total, pendingAction, ...countMap });
        }

        const returns = await prisma.returnRequest.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        total: true,
                        paidAt: true,
                        paymentId: true,
                        status: true,
                    },
                },
                items: {
                    include: {
                        orderItem: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        image: true,
                                        primaryImage: true,
                                    },
                                },
                                color: { select: { name: true } },
                                size: { select: { name: true } },
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
    } catch (error: any) {
        console.error("[ADMIN_RETURNS_GET]", error);
        return NextResponse.json(
            { error: "İade talepleri yüklenirken hata oluştu" },
            { status: 500 }
        );
    }
}
