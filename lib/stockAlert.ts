import { prisma } from "@/lib/db";

interface LowStockProduct {
    productId: string;
    productName: string;
    variantId?: string;
    variantCode?: string;
    currentStock: number;
    threshold: number;
}

/**
 * Check for products below stock threshold
 */
export async function checkLowStockProducts(): Promise<LowStockProduct[]> {
    const lowStockItems: LowStockProduct[] = [];

    // Get stock alerts with their thresholds
    const alerts = await prisma.stockAlert.findMany({
        where: { isEnabled: true },
    });

    // Create lookup map for thresholds
    const thresholdMap = new Map<string, number>();
    alerts.forEach((alert: any) => {
        const key = alert.variantId
            ? `${alert.productId}-${alert.variantId}`
            : alert.productId;
        thresholdMap.set(key, alert.threshold);
    });

    // Default threshold for products without specific alerts
    const defaultThreshold = 5;

    // Check variants
    const variants = await prisma.productVariant.findMany({
        where: { isActive: true },
        include: {
            product: { select: { id: true, name: true } },
        },
    });

    for (const variant of variants as any[]) {
        const thresholdKey = `${variant.productId}-${variant.id}`;
        const productKey = variant.productId;
        const threshold =
            thresholdMap.get(thresholdKey) ||
            thresholdMap.get(productKey) ||
            defaultThreshold;

        if (variant.stock < threshold) {
            lowStockItems.push({
                productId: variant.productId,
                productName: variant.product.name,
                variantId: variant.id,
                variantCode: variant.variantCode,
                currentStock: variant.stock,
                threshold,
            });
        }
    }

    return lowStockItems;
}

/**
 * Set stock alert threshold for a product/variant
 */
export async function setStockAlert(
    productId: string,
    threshold: number,
    variantId?: string
): Promise<void> {
    await prisma.stockAlert.upsert({
        where: {
            productId_variantId: {
                productId,
                variantId: (variantId || null) as any,
            },
        },
        update: {
            threshold,
            isEnabled: true,
        },
        create: {
            productId,
            variantId,
            threshold,
            isEnabled: true,
        },
    });
}

/**
 * Disable stock alert for a product/variant
 */
export async function disableStockAlert(
    productId: string,
    variantId?: string
): Promise<void> {
    await prisma.stockAlert.updateMany({
        where: {
            productId,
            variantId: variantId || null,
        },
        data: { isEnabled: false },
    });
}

/**
 * Get stock summary for dashboard
 */
export async function getStockSummary() {
    // Total products
    const totalProducts = await prisma.product.count({
        where: { isActive: true },
    });

    // Products with low stock (any variant below 5)
    const lowStockProducts = await checkLowStockProducts();
    const uniqueLowStockProducts = new Set(
        lowStockProducts.map((p: any) => p.productId)
    );

    // Out of stock (0 stock in all variants)
    const outOfStockVariants = await prisma.productVariant.groupBy({
        by: ["productId"],
        where: { isActive: true },
        _sum: { stock: true },
        having: {
            stock: { _sum: { equals: 0 } },
        },
    });

    return {
        totalProducts,
        lowStockCount: uniqueLowStockProducts.size,
        outOfStockCount: outOfStockVariants.length,
        lowStockItems: lowStockProducts.slice(0, 10), // First 10 for quick view
    };
}
