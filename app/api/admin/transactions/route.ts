import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authConfig);

        if (!session || !session.user.isAdmin) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "all";
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (status !== "all") {
            where.paymentStatus = status;
        }

        const [transactions, total] = await Promise.all([
            prisma.order.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    image: true,
                                },
                            },
                        },
                    },
                    billingAddress: true,
                    shippingAddress: true,
                    payment: true, // Include payment attempt details if available
                },
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({
            transactions,
            total,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("[TRANSACTIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
