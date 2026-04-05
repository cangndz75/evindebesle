
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { commitReservationToSaleTx, releaseReservationTx } from "@/lib/stock";
import { createAdminNotification } from "@/lib/admin-notification";
import { clearRedisCart } from "@/lib/cart-redis";

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
                    status: "PAID" as OrderStatus,
                    paymentStatus: "PAID",
                    paidAt: new Date(),
                    paymentId: paymentId,
                },
            });

            if (order.couponId) {
                const coupon = await tx.coupon.findUnique({
                    where: { id: order.couponId },
                    select: { id: true, maxUsage: true, isActive: true },
                });

                if (coupon?.isActive) {
                    if (coupon.maxUsage == null) {
                        await tx.coupon.update({
                            where: { id: coupon.id },
                            data: { usageCount: { increment: 1 } },
                        });
                    } else {
                        await tx.coupon.updateMany({
                            where: {
                                id: coupon.id,
                                usageCount: { lt: coupon.maxUsage },
                            },
                            data: { usageCount: { increment: 1 } },
                        });
                    }
                }

                if (order.userId) {
                    await tx.userCoupon.updateMany({
                        where: { userId: order.userId, couponId: order.couponId },
                        data: { usedAt: new Date() },
                    });
                }
            }

            // Clear user's cart
            await tx.cartItem.deleteMany({
                where: { userId: order.userId }
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

        // 2. Stock Management
        await commitReservationToSaleTx(orderId);

        if (result.order.userId) {
            await clearRedisCart(result.order.userId);
        }

        // 3. Send Notification
        try {
            // We need to fetch the order number for the notification message if we don't have it in the result.order object yet (it should be there)
            // result.order is the updated order object
            await createAdminNotification({
                type: "ORDER",
                title: "Yeni Sipariş Alındı",
                message: `#${result.order.orderNumber} numaralı sipariş başarıyla oluşturuldu.`,
                link: `/admin/orders/${result.order.id}` // Corrected link path
            });
        } catch (notifError) {
            console.error("Failed to send admin notification:", notifError);
            // Don't fail the request if notification fails
        }

        return result.order;

    } catch (error) {
        console.error("Payment Finalization Error:", error);
        throw error;
    }
}
