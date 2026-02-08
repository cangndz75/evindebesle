import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                image: true,
                            }
                        },
                        color: { select: { id: true, name: true } },
                        size: { select: { id: true, name: true } },
                    },
                },
                shippingAddress: {
                    include: {
                        district: true,
                    }
                },
                billingAddress: {
                    include: {
                        district: true,
                    }
                },
                coupon: {
                    select: {
                        code: true,
                        discountType: true,
                        value: true,
                    }
                }
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Security check: Only allow users to view their own orders (unless admin)
        if (order.userId !== user.id && !user.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(order);

    } catch (error) {
        console.error("Order detail fetch error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
