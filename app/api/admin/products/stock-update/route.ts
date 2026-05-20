import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/auditLog";
import { revalidatePath } from "next/cache";
import { syncSizeStocksFromVariants } from "@/lib/stock";
import { processBackInStockNotifications } from "@/lib/services/stock-back-in-stock";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { variantId, isVariant, stock } = await req.json();

        if (!variantId || stock < 0) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const newStock = Math.max(0, Number(stock));

        let productForRevalidate: { id: string; slug: string | null } | null = null;

        if (isVariant) {
            const existingVariant = await prisma.productVariant.findUnique({
                where: { id: variantId },
                select: { id: true, stock: true, productId: true },
            });

            if (!existingVariant) {
                return NextResponse.json({ error: "Variant not found" }, { status: 404 });
            }

            await prisma.productVariant.update({
                where: { id: variantId },
                data: { stock: newStock }
            });

            const diff = newStock - (existingVariant.stock || 0);
            if (diff !== 0) {
                await prisma.stockMovement.create({
                    data: {
                        productId: existingVariant.productId,
                        variantId: existingVariant.id,
                        quantity: Math.abs(diff),
                        type: "ADJUSTMENT",
                        reason: "Admin stock update",
                        userId: session.user.id,
                    },
                });
            }

            await syncSizeStocksFromVariants(existingVariant.productId);

            await processBackInStockNotifications({
                productId: existingVariant.productId,
                variantId: existingVariant.id,
                previousStock: existingVariant.stock || 0,
                newStock,
            });

            const variant = await prisma.productVariant.findUnique({
                where: { id: variantId },
                select: {
                    product: {
                        select: { id: true, slug: true }
                    }
                }
            });
            productForRevalidate = variant?.product ?? null;
        } else {
            const existingSize = await prisma.productSize.findUnique({
                where: { id: variantId },
                select: { id: true, stock: true, productId: true },
            });

            if (!existingSize) {
                return NextResponse.json({ error: "Size not found" }, { status: 404 });
            }

            await prisma.productSize.update({
                where: { id: variantId },
                data: { stock: newStock }
            });

            const diff = newStock - (existingSize.stock || 0);
            if (diff !== 0) {
                await prisma.stockMovement.create({
                    data: {
                        productId: existingSize.productId,
                        quantity: Math.abs(diff),
                        type: "ADJUSTMENT",
                        reason: "Admin size stock update",
                        userId: session.user.id,
                    },
                });
            }

            const size = await prisma.productSize.findUnique({
                where: { id: variantId },
                select: {
                    productId: true,
                    product: {
                        select: { id: true, slug: true }
                    }
                }
            });

            if (size?.productId) {
                const variantForNotify = await prisma.productVariant.findFirst({
                    where: { productId: size.productId, sizeId: variantId },
                    select: { id: true },
                });
                await processBackInStockNotifications({
                    productId: size.productId,
                    variantId: variantForNotify?.id ?? null,
                    previousStock: existingSize.stock || 0,
                    newStock,
                });
            }

            productForRevalidate = size?.product ?? null;
        }

        const user = session.user as any;
        await logAuditAction({
            action: "STOCK_UPDATE",
            adminId: user.id || "system",
            adminEmail: user.email || "system",
            targetType: "Product",
            targetId: variantId, // Using variant/size id as proxy
            details: {
                variantId,
                newStock,
                type: isVariant ? "variant" : "size"
            }
        });

        revalidatePath("/home");
        revalidatePath("/collections");
        if (productForRevalidate) {
            revalidatePath(`/product/${productForRevalidate.id}`);
            if (productForRevalidate.slug) {
                revalidatePath(`/products/${productForRevalidate.slug}`);
                revalidatePath(`/product/${productForRevalidate.slug}`);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Stock update error:", error);
        return NextResponse.json(
            { error: "Stok güncellenemedi" },
            { status: 500 }
        );
    }
}
