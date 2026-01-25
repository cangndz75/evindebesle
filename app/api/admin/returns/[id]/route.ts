import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { status, adminNote } = await request.json();

        // Admin check
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true },
        });

        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        orderItem: true,
                    },
                },
            },
        });

        if (!returnRequest) {
            return NextResponse.json({ error: "İade bulunamadı" }, { status: 404 });
        }

        // Transaction start
        await prisma.$transaction(async (tx) => {
            // 1. Update ReturnRequest status
            await tx.returnRequest.update({
                where: { id },
                data: {
                    status,
                    adminNote,
                },
            });

            // 2. If APPROVED, process stock movements
            if (status === "APPROVED") {
                for (const item of returnRequest.items) {
                    const { productId, sizeId, colorId } = item.orderItem;

                    // Find Variant if exists
                    let variantId = null;
                    if (sizeId || colorId) {
                        const variant = await tx.productVariant.findFirst({
                            where: {
                                productId,
                                sizeId: sizeId || undefined,
                                colorId: colorId || undefined,
                            }
                        });
                        variantId = variant?.id;
                    }

                    // Create Stock Movement (Increase Stock)
                    await tx.stockMovement.create({
                        data: {
                            productId,
                            variantId,
                            quantity: item.quantity,
                            type: "RETURN",
                            reason: `İade Talebi #${id} Onayı`,
                            userId: session.user.id,
                        },
                    });

                    // Also allow 'AuditLog'? Maybe later.
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Return update error:", error);
        return NextResponse.json(
            { error: "İade güncellenirken hata oluştu" },
            { status: 500 }
        );
    }
}
