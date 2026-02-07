import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authConfig);

        if (!session?.user?.isAdmin) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const userId = searchParams.get("userId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status && status !== "all") {
            where.status = status;
        }
        if (userId) {
            where.userId = userId;
        }

        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: { messages: true },
                    },
                },
                orderBy: {
                    updatedAt: "desc",
                },
                skip,
                take: limit,
            }),
            prisma.supportTicket.count({ where }),
        ]);

        return NextResponse.json({
            tickets,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error("[ADMIN_SUPPORT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
