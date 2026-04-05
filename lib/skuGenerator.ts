import { prisma } from "@/lib/db";


interface SKUOptions {
    categoryPrefix?: string; // K = KadÄ±n, E = Erkek, U = Unisex
    brandPrefix?: string;    // First 4 chars of brand
    colorCode?: string;      // Color identifier
    sizeCode?: string;       // Size (S, M, L, 36, 38, etc.)
}

export function generateSKU(options: SKUOptions = {}): string {
    const parts: string[] = [];

    parts.push(options.categoryPrefix || "PRD");

    if (options.brandPrefix) {
        parts.push(
            options.brandPrefix
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 4)
        );
    }

    if (options.colorCode) {
        parts.push(options.colorCode.slice(0, 6).toUpperCase());
    }

    if (options.sizeCode) {
        parts.push(options.sizeCode.toUpperCase());
    }

    const randomSuffix = generateRandomCode(4);
    parts.push(randomSuffix);

    return parts.join("-");
}

function generateRandomCode(length: number): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars (0, O, 1, I)
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function generateUniqueStockCode(
    options: SKUOptions = {}
): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const sku = generateSKU(options);

        const existing = await prisma.product.findUnique({
            where: { stockCode: sku },
            select: { id: true },
        });

        if (!existing) {
            return sku;
        }

        attempts++;
    }

    return `${generateSKU(options)}-${Date.now().toString(36).toUpperCase()}`;
}

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
