import { prisma } from "@/lib/db";

export async function reserveStockTx(orderId: string, items: { variantId: string; qty: number }[], ttlMinutes = 15) {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    await prisma.$transaction(async (tx: any) => {
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
    await prisma.$transaction(async (tx: any) => {
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
    await prisma.$transaction(async (tx: any) => {
        const reservations = await tx.stockReservation.findMany({
            where: { orderId, releasedAt: null },
        });

        for (const r of reservations) {
            const result = await tx.productVariant.updateMany({
                where: {
                    id: r.variantId,
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
