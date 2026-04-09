import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function syncSizeStocksFromVariantsTx(tx: Prisma.TransactionClient, productId: string) {
    const sizes = await tx.productSize.findMany({
        where: { productId },
        select: { id: true },
    });

    if (sizes.length === 0) {
        return;
    }

    const variants = await tx.productVariant.findMany({
        where: { productId, sizeId: { not: null } },
        select: { sizeId: true, stock: true },
    });

    const totals = new Map<string, number>();
    for (const variant of variants) {
        if (!variant.sizeId) {
            continue;
        }
        totals.set(variant.sizeId, (totals.get(variant.sizeId) || 0) + (variant.stock || 0));
    }

    for (const size of sizes) {
        await tx.productSize.update({
            where: { id: size.id },
            data: { stock: totals.get(size.id) || 0 },
        });
    }
}

export async function syncSizeStocksFromVariants(productId: string) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await syncSizeStocksFromVariantsTx(tx, productId);
    });
}

export async function reserveStockTx(orderId: string, items: { variantId: string; qty: number }[], ttlMinutes = 15) {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        for (const it of items) {
            const affectedRows = await tx.$executeRaw`
                UPDATE "ProductVariant"
                SET "stockReserved" = "stockReserved" + ${it.qty}
                WHERE "id" = ${it.variantId}
                  AND ("stock" - "stockReserved") >= ${it.qty}
            `;

            if (Number(affectedRows) !== 1) {
                throw new Error(`INSUFFICIENT_STOCK_FOR_VARIANT:${it.variantId}`);
            }

            await tx.stockReservation.create({
                data: { orderId, variantId: it.variantId, quantity: it.qty, expiresAt },
            });
        }

        await tx.order.update({
            where: { id: orderId },
            data: { reservedUntil: expiresAt },
        });
    });

    return { expiresAt };
}

export async function releaseReservationTx(orderId: string) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const reservations = await tx.stockReservation.findMany({
            where: { orderId, releasedAt: null },
        });

        for (const r of reservations) {
            const result = await tx.productVariant.updateMany({
                where: {
                    id: r.variantId,
                    stockReserved: { gte: r.quantity },
                },
                data: { stockReserved: { decrement: r.quantity } },
            });

            if (result.count !== 1) {
                throw new Error(`INVALID_STOCK_RESERVATION_STATE:${r.variantId}`);
            }
        }

        await tx.stockReservation.updateMany({
            where: { orderId, releasedAt: null },
            data: { releasedAt: new Date() },
        });

        await tx.order.update({
            where: { id: orderId },
            data: { reservedUntil: null },
        });
    });
}

export async function commitReservationToSaleTx(orderId: string) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const reservations = await tx.stockReservation.findMany({
            where: { orderId, releasedAt: null },
        });

        const touchedProductIds = new Set<string>();

        for (const r of reservations) {
            const variant = await tx.productVariant.findUnique({
                where: { id: r.variantId },
                select: { id: true, productId: true },
            });

            if (!variant) {
                throw new Error(`VARIANT_NOT_FOUND:${r.variantId}`);
            }

            const result = await tx.productVariant.updateMany({
                where: {
                    id: variant.id,
                    stock: { gte: r.quantity },
                    stockReserved: { gte: r.quantity },
                },
                data: {
                    stock: { decrement: r.quantity },
                    stockReserved: { decrement: r.quantity },
                },
            });

            if (result.count !== 1) {
                throw new Error(`STOCK_COMMIT_CONFLICT:${r.variantId}`);
            }

            await tx.stockMovement.create({
                data: {
                    productId: variant.productId,
                    variantId: variant.id,
                    quantity: r.quantity,
                    type: "SALE",
                    reason: `Order ${orderId} paid`,
                },
            });

            touchedProductIds.add(variant.productId);
        }

        for (const productId of touchedProductIds) {
            await syncSizeStocksFromVariantsTx(tx, productId);
        }

        await tx.stockReservation.updateMany({
            where: { orderId, releasedAt: null },
            data: { releasedAt: new Date() },
        });

        await tx.order.update({
            where: { id: orderId },
            data: { reservedUntil: null },
        });
    });
}

export async function releaseExpiredReservations() {
    const now = new Date();
    const expiredOrders = await prisma.stockReservation.findMany({
        where: {
            releasedAt: null,
            OR: [
                { expiresAt: { lte: now } },
                {
                    order: {
                        status: {
                            in: ["PAYMENT_FAILED", "CANCELLED", "DRAFT"],
                        },
                    },
                },
            ],
        },
        select: { orderId: true },
        distinct: ["orderId"],
    });

    for (const row of expiredOrders) {
        try {
            await releaseReservationTx(row.orderId);
        } catch (error) {
            console.error("Expired reservation release error:", row.orderId, error);
        }
    }

    return { releasedOrders: expiredOrders.length };
}
