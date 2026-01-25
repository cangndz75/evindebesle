import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { logAuditAction } from "@/lib/auditLog";

// POST: Ürün kopyala
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json(
                { error: "Ürün ID'si gerekli" },
                { status: 400 }
            );
        }

        // Get original product with all relations
        const original = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                colors: true,
                sizes: true,
                tags: true,
                productImages: true,
                variants: true,
                sizeOptions: true,
            },
        });

        if (!original) {
            return NextResponse.json(
                { error: "Ürün bulunamadı" },
                { status: 404 }
            );
        }

        // Generate unique slug
        const baseSlug = original.slug || original.name.toLowerCase().replace(/\s+/g, "-");
        let newSlug = `${baseSlug}-copy`;
        let counter = 1;

        // Check if slug exists
        while (await prisma.product.findUnique({ where: { slug: newSlug } })) {
            newSlug = `${baseSlug}-copy-${counter}`;
            counter++;
        }

        // Generate unique stock code
        let newStockCode = original.stockCode ? `${original.stockCode}-COPY` : null;
        if (newStockCode) {
            counter = 1;
            while (await prisma.product.findUnique({ where: { stockCode: newStockCode } })) {
                newStockCode = `${original.stockCode}-COPY-${counter}`;
                counter++;
            }
        }

        // Create new product
        const newProduct = await prisma.product.create({
            data: {
                name: `${original.name} (Kopya)`,
                slug: newSlug,
                stockCode: newStockCode,
                description: original.description,
                detailText: original.detailText,
                price: original.price,
                originalPrice: original.originalPrice,
                image: original.image,
                primaryImage: original.primaryImage,
                secondaryImage: original.secondaryImage,
                gender: original.gender,
                sizeType: original.sizeType,
                fabricType: original.fabricType,
                categoryId: original.categoryId,
                brand: original.brand,
                weight: original.weight,
                isActive: false, // Start as inactive so admin can review

                // Copy colors
                colors: {
                    create: original.colors.map((color: { name: string; hexCode: string | null }) => ({
                        colorCode: `${color.name.toUpperCase().slice(0, 3)}-${Date.now()}`, // Unique color code
                        name: color.name,
                        hexCode: color.hexCode,
                    })),
                },

                // Copy sizes
                sizes: {
                    create: original.sizes.map((size: { name: string }) => ({
                        name: size.name,
                        stock: 0, // Start with 0 stock
                    })),
                },

                // Copy tags
                tags: {
                    create: original.tags.map((tag: { name: string }) => ({
                        name: tag.name,
                    })),
                },

                // Copy product images
                productImages: {
                    create: original.productImages.map((img: { url: string; order: number; isPrimary: boolean; isSecondary: boolean; alt: string | null }) => ({
                        url: img.url,
                        order: img.order,
                        isPrimary: img.isPrimary,
                        isSecondary: img.isSecondary,
                        alt: img.alt,
                    })),
                },

                // Copy size options
                sizeOptions: {
                    create: original.sizeOptions.map((opt: { name: string; isActive: boolean }) => ({
                        name: opt.name,
                        isActive: opt.isActive,
                    })),
                },
            },
            include: {
                colors: true,
                sizes: true,
            },
        });

        // Create variants for new product (color x size combinations)
        if (newProduct.colors.length > 0 && newProduct.sizes.length > 0) {
            const variantData = [];
            for (const color of newProduct.colors) {
                for (const size of newProduct.sizes) {
                    variantData.push({
                        productId: newProduct.id,
                        colorId: color.id,
                        sizeId: size.id,
                        variantCode: `${newProduct.id}-${color.id}-${size.id}`.slice(0, 20),
                        stock: 0,
                        isActive: true,
                    });
                }
            }

            await prisma.productVariant.createMany({
                data: variantData,
                skipDuplicates: true,
            });
        }

        // Audit log
        await logAuditAction({
            action: "PRODUCT_CREATE",
            adminId: user.id,
            adminEmail: user.email || "",
            targetType: "Product",
            targetId: newProduct.id,
            details: {
                action: "duplicate",
                originalProductId: original.id,
                originalProductName: original.name,
            },
            ipAddress: req.headers.get("x-forwarded-for") || undefined,
            userAgent: req.headers.get("user-agent") || undefined,
        });

        return NextResponse.json({
            success: true,
            message: "Ürün kopyalandı",
            product: {
                id: newProduct.id,
                name: newProduct.name,
                slug: newProduct.slug,
            },
        });
    } catch (error) {
        console.error("Error duplicating product:", error);
        return NextResponse.json(
            { error: "Kopyalama sırasında bir hata oluştu" },
            { status: 500 }
        );
    }
}
