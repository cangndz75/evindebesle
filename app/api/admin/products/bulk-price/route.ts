import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { logAuditAction } from "@/lib/auditLog";
import { rateLimitCheck } from "@/lib/middleware/rateLimitMiddleware";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
    try {
        const rateLimitError = await rateLimitCheck(req, "upload");
        if (rateLimitError) return rateLimitError;

        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productIds, updateType, value } = await req.json();

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json(
                { error: "Ürün ID'leri gerekli" },
                { status: 400 }
            );
        }

        if (!updateType || !["PERCENT_INCREASE", "PERCENT_DECREASE", "FIXED_INCREASE", "FIXED_DECREASE", "SET_PRICE"].includes(updateType)) {
            return NextResponse.json(
                { error: "Geçersiz güncelleme tipi" },
                { status: 400 }
            );
        }

        if (typeof value !== "number" || value < 0) {
            return NextResponse.json(
                { error: "Geçerli bir değer giriniz" },
                { status: 400 }
            );
        }

        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, price: true, originalPrice: true },
        });

        if (products.length === 0) {
            return NextResponse.json(
                { error: "Ürün bulunamadı" },
                { status: 404 }
            );
        }

        const updates = products.map((product: any) => {
            let newPrice = product.price;

            switch (updateType) {
                case "PERCENT_INCREASE":
                    newPrice = product.price * (1 + value / 100);
                    break;
                case "PERCENT_DECREASE":
                    newPrice = product.price * (1 - value / 100);
                    break;
                case "FIXED_INCREASE":
                    newPrice = product.price + value;
                    break;
                case "FIXED_DECREASE":
                    newPrice = Math.max(0, product.price - value);
                    break;
                case "SET_PRICE":
                    newPrice = value;
                    break;
            }

            newPrice = Math.round(newPrice * 100) / 100;

            return {
                id: product.id,
                oldPrice: product.price,
                newPrice,
                originalPrice: updateType === "PERCENT_DECREASE" || updateType === "FIXED_DECREASE"
                    ? product.originalPrice || product.price
                    : product.originalPrice,
            };
        });

        await prisma.$transaction(
            updates.map((update: any) =>
                prisma.product.update({
                    where: { id: update.id },
                    data: {
                        price: update.newPrice,
                        originalPrice: update.originalPrice,
                    },
                })
            )
        );

        await logAuditAction({
            action: "BULK_PRICE_UPDATE",
            adminId: user.id,
            adminEmail: user.email || "",
            targetType: "Product",
            details: {
                productCount: products.length,
                updateType,
                value,
                productIds,
            },
            ipAddress: req.headers.get("x-forwarded-for") || undefined,
            userAgent: req.headers.get("user-agent") || undefined,
        });

        revalidatePath("/home");
        revalidatePath("/collections");

        const slugs = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, slug: true },
            take: 100,
        });

        for (const product of slugs) {
            revalidatePath(`/product/${product.id}`);
            if (product.slug) {
                revalidatePath(`/products/${product.slug}`);
                revalidatePath(`/product/${product.slug}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `${products.length} ürün fiyatı güncellendi`,
            updates: updates.map((u: any) => ({
                id: u.id,
                oldPrice: u.oldPrice,
                newPrice: u.newPrice,
            })),
        });
    } catch (error) {
        console.error("Error in bulk price update:", error);
        return NextResponse.json(
            { error: "İşlem sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}
