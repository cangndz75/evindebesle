
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { commitReservationToSaleTx, releaseReservationTx } from "@/lib/stock";
import { createAdminNotification } from "@/lib/admin-notification";
import { clearRedisCart } from "@/lib/cart-redis";
import { sendAdminOrderPaidSms } from "@/lib/sms";
import { sendAdminOrderWhatsApp } from "@/lib/whatsapp";
import { enqueueOrderPostPaymentJob } from "@/lib/queue/order-post-payment";
import { runOrderPostPaymentTasks } from "@/lib/services/order-post-payment";
import { sendTelegramMessage, TelegramTemplates } from "@/lib/telegramService";

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
        const result = await prisma.$transaction(async (tx: any) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { payment: true },
            });

            if (!order) {
                throw new Error(`Order not found: ${orderId}`);
            }

            if (order.status !== "PENDING_PAYMENT" && order.status !== "DRAFT") {
                return {
                    status: "ALREADY_PROCESSED",
                    order
                };
            }

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
                    select: { id: true, maxUsage: true, isActive: true, expiresAt: true },
                });

                const couponStillValid =
                    coupon?.isActive &&
                    (coupon.expiresAt == null || coupon.expiresAt > new Date());

                if (couponStillValid) {
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

            await tx.cartItem.deleteMany({
                where: { userId: order.userId }
            });

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

        await commitReservationToSaleTx(orderId);

        if (result.order.userId) {
            await clearRedisCart(result.order.userId);
        }

        try {
            const queued = await enqueueOrderPostPaymentJob({
                orderId: result.order.id,
            });

            if (!queued.queued) {
                const orderWithDetails = await prisma.order.findUnique({
                    where: { id: result.order.id },
                    include: {
                        user: { select: { name: true } },
                        items: { select: { id: true } },
                    },
                });

                await Promise.allSettled([
                    createAdminNotification({
                        type: "ORDER",
                        title: "Yeni Sipariş Alındı",
                        message: `#${result.order.orderNumber} numaralı sipariş başarıyla oluşturuldu.`,
                        link: `/admin-orders/${result.order.id}`
                    }),
                    sendAdminOrderPaidSms({
                        orderNumber: result.order.orderNumber,
                        total: result.order.total,
                        orderId: result.order.id,
                    }),
                    sendAdminOrderWhatsApp({
                        orderNumber: result.order.orderNumber,
                        total: result.order.total,
                        orderId: result.order.id,
                    }),
                    sendTelegramMessage(TelegramTemplates.newOrder({
                        orderNumber: result.order.orderNumber,
                        customerName: orderWithDetails?.user?.name || "Misafir",
                        totalAmount: result.order.total,
                        itemsCount: orderWithDetails?.items?.length || 0,
                    })),
                    runOrderPostPaymentTasks(result.order.id),
                ]);
            }
        } catch (queueError) {
            console.error("Post-payment queue error:", queueError);
        }

        return result.order;

    } catch (error) {
        console.error("Payment Finalization Error:", error);
        throw error;
    }
}
