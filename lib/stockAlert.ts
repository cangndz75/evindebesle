import { prisma } from "@/lib/db";

interface LowStockProduct {
    productId: string;
    productName: string;
    variantId?: string;
    variantCode?: string;
    currentStock: number;
    threshold: number;
}

export async function checkLowStockProducts(): Promise<LowStockProduct[]> {
    const lowStockItems: LowStockProduct[] = [];

    const alerts = await prisma.stockAlert.findMany({
        where: { isEnabled: true },
    });

    const thresholdMap = new Map<string, number>();
    alerts.forEach((alert: any) => {
        const key = alert.variantId
            ? `${alert.productId}-${alert.variantId}`
            : alert.productId;
        thresholdMap.set(key, alert.threshold);
    });

    const defaultThreshold = 5;

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

export async function getStockSummary() {
    const totalProducts = await prisma.product.count({
        where: { isActive: true },
    });

    const lowStockProducts = await checkLowStockProducts();
    const uniqueLowStockProducts = new Set(
        lowStockProducts.map((p: any) => p.productId)
    );

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
