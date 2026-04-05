import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { jsonNoStore } from "@/lib/api/policy";
import { toOrderDetailDTO } from "@/lib/api/dto/order";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();

        if (!user) {
            return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
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
                },
                user: {
                    select: {
                        fullAddress: true,
                        district: true,
                    },
                },
                payment: {
                    select: {
                        provider: true,
                    },
                }
            },
        });

        if (!order) {
            return jsonNoStore({ error: "Order not found" }, { status: 404 });
        }

        if (order.userId !== user.id && !user.isAdmin) {
            return jsonNoStore({ error: "Forbidden" }, { status: 403 });
        }

        return jsonNoStore(toOrderDetailDTO(order));

    } catch (error) {
        console.error("Order detail fetch error:", error);
        return jsonNoStore(
            { error: "ORDER_DETAIL_FETCH_EXCEPTION" },
            { status: 500 }
        );
    }
}
