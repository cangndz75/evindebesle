import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

// GET: List user's return requests
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

// POST: Create a new return request
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

        // Verify the order belongs to the user and is delivered
        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
                userId: session.user.id,
            },
            include: {
                items: true,
            },
        });

        if (!order) {
            return new NextResponse("Order not found", { status: 404 });
        }

        if (order.status !== "DELIVERED") {
            return new NextResponse("Only delivered orders can be returned", { status: 400 });
        }

        // Check if a return request already exists for this order
        const existingReturn = await prisma.returnRequest.findFirst({
            where: {
                orderId,
                status: {
                    in: ["PENDING", "APPROVED"],
                },
            },
        });

        if (existingReturn) {
            return new NextResponse("A return request already exists for this order", { status: 400 });
        }

        // Validate items belong to the order
        const orderItemIds = order.items.map((item: { id: string }) => item.id);
        for (const item of items as { orderItemId: string; quantity: number; reason?: string }[]) {
            if (!orderItemIds.includes(item.orderItemId)) {
                return new NextResponse("Invalid order item", { status: 400 });
            }
        }

        // Create the return request with items
        const returnRequest = await prisma.returnRequest.create({
            data: {
                orderId,
                userId: session.user.id,
                reason,
                description: description || null,
                images: images || [],
                status: "PENDING",
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

        // TODO: Send notification email to user
        // TODO: Create admin notification

        return NextResponse.json(returnRequest);
    } catch (error) {
        console.error("[RETURNS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
