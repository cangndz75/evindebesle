
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { commitReservationToSaleTx, releaseReservationTx } from "@/lib/stock";

interface FinalizePaymentParams {
    orderId: string;
    conversationId?: string;
    paymentId?: string;
    rawResult?: any;
}

export async function finalizePayment({
    orderId,
    conversationId,
    paymentId,
    rawResult,
}: FinalizePaymentParams) {
    try {
        // 1. Transactional update
        const result = await prisma.$transaction(async (tx: any) => {
            // Check current order status to ensure idempotency
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { payment: true },
            });

            if (!order) {
                throw new Error(`Order not found: ${orderId}`);
            }

            // If already paid, return early (Idempotency)
            if (order.status !== "PENDING_PAYMENT" && order.status !== "DRAFT") {
                return {
                    status: "ALREADY_PROCESSED",
                    order
                };
            }

            // Update PaymentAttempt
            if (order.payment) {
                await tx.paymentAttempt.update({
                    where: { id: order.payment.id },
                    data: {
                        status: "PAID",
                        paymentId,
                        conversationId,
                        rawResult: rawResult ? (rawResult as any) : undefined,
                    }
                });
            }

            // Update Order Status
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: "PREPARING" as OrderStatus, // or PAID
                    paymentStatus: "PAID",
                    paidAt: new Date(),
                    paymentId: paymentId,
                },
            });

            // Audit Log
            await tx.auditLog.create({
                data: {
                    action: "PAYMENT_SUCCESS",
                    entityType: "ORDER",
                    entityId: orderId,
                    details: { paymentId, conversationId },
                },
            });

            return { status: "SUCCESS", order: updatedOrder };
        });

        if (result.status === "ALREADY_PROCESSED") {
            console.log(`Order ${orderId} already processed.`);
            return result.order;
        }

        // 2. Stock Management (Outside the main transaction to avoid long locking if complex, 
        // but better inside if consistency is paramount. 
        // implementation_plan said: "Consume Stock (if reserved) or release (if failed)"
        // The stock.ts functions are strictly transactional themselves. 
        // Calling them here effectively makes multiple transactions, which is slightly risky if server crashes in between.
        // However, since we marked order as PAID, a mismatch would mean stock is reserved but order is paid (so stock acts as sold).
        // Correct approach: commitReservationToSaleTx handles converting reservation to decrement.

        await commitReservationToSaleTx(orderId);

        return result.order;

    } catch (error) {
        console.error("Payment Finalization Error:", error);

        // If we failed to finalize, we might want to release stock? 
        // No, only if we determined payment FAILED. 
        // Here we are inside finalizePayment only called when payment IS successful.
        // If database update fails, we throw. 
        throw error;
    }
}
