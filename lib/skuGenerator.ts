import { prisma } from "@/lib/db";

/**
 * SKU (Stock Keeping Unit) Generator
 * Format: CAT-BRAND-COLORCODE-SIZE-RANDOM
 * Example: KADIN-DARK-A1B2C3-M-X9Y8
 */

interface SKUOptions {
    categoryPrefix?: string; // K = Kadın, E = Erkek, U = Unisex
    brandPrefix?: string;    // First 4 chars of brand
    colorCode?: string;      // Color identifier
    sizeCode?: string;       // Size (S, M, L, 36, 38, etc.)
}

/**
 * Generate a unique SKU for a product variant
 */
export function generateSKU(options: SKUOptions = {}): string {
    const parts: string[] = [];

    // Category prefix (default: PRD for Product)
    parts.push(options.categoryPrefix || "PRD");

    // Brand prefix (max 4 chars, uppercase)
    if (options.brandPrefix) {
        parts.push(
            options.brandPrefix
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 4)
        );
    }

    // Color code (max 6 chars)
    if (options.colorCode) {
        parts.push(options.colorCode.slice(0, 6).toUpperCase());
    }

    // Size code
    if (options.sizeCode) {
        parts.push(options.sizeCode.toUpperCase());
    }

    // Random suffix for uniqueness (4 chars)
    const randomSuffix = generateRandomCode(4);
    parts.push(randomSuffix);

    return parts.join("-");
}

/**
 * Generate random alphanumeric code
 */
function generateRandomCode(length: number): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars (0, O, 1, I)
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate a unique product stock code
 * Checks database for uniqueness
 */
export async function generateUniqueStockCode(
    options: SKUOptions = {}
): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const sku = generateSKU(options);

        // Check if exists in database
        const existing = await prisma.product.findUnique({
            where: { stockCode: sku },
            select: { id: true },
        });

        if (!existing) {
            return sku;
        }

        attempts++;
    }

    // If all attempts fail, add timestamp
    return `${generateSKU(options)}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Generate unique variant code
 */
export async function generateUniqueVariantCode(
    productId: string,
    colorId?: string,
    sizeId?: string
): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const baseCode = [
            productId.slice(-4),
            colorId?.slice(-4) || "X",
            sizeId?.slice(-4) || "X",
            generateRandomCode(4),
        ].join("-");

        const existing = await prisma.productVariant.findUnique({
            where: { variantCode: baseCode },
            select: { id: true },
        });

        if (!existing) {
            return baseCode;
        }

        attempts++;
    }

    return `${productId.slice(-4)}-${Date.now().toString(36)}`;
}

/**
 * Generate stock codes for all products without one
 */
export async function generateMissingStockCodes(): Promise<{
    updated: number;
    failed: string[];
}> {
    const productsWithoutCode = await prisma.product.findMany({
        where: {
            OR: [{ stockCode: null }, { stockCode: "" }],
        },
        select: {
            id: true,
            name: true,
            brand: true,
            gender: true,
            category: { select: { name: true } },
        },
    });

    let updated = 0;
    const failed: string[] = [];

    for (const product of productsWithoutCode) {
        try {
            const categoryPrefix =
                product.gender === "FEMALE"
                    ? "K"
                    : product.gender === "MALE"
                        ? "E"
                        : "U";

            const stockCode = await generateUniqueStockCode({
                categoryPrefix,
                brandPrefix: product.brand || undefined,
            });

            await prisma.product.update({
                where: { id: product.id },
                data: { stockCode },
            });

            updated++;
        } catch (error) {
            console.error(`Failed to generate SKU for ${product.name}:`, error);
            failed.push(product.name);
        }
    }

    return { updated, failed };
}
