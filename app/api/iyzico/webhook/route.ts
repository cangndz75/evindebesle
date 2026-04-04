import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { iyzico, iyzicoCall } from "@/lib/iyzico";
import { commitReservationToSaleTx } from "@/lib/stock";
import { finalizePayment } from "@/lib/services/payment";
import { redactForLog } from "@/lib/security/log";
// import { createAdminNotification } from "@/lib/admin-notification"; // Removed as it's now internal to finalizePayment

/**
 * Iyzico Webhook Handler
 * 
 * This endpoint is called asynchronously by Iyzico to notify about payment results.
 * It's crucial for cases where the user closes the browser before the callback completes.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Iyzico Webhook typically includes iyziEventType and other fields.
        // For standard payment notifications:
        const { iyziEventType, iyziReferenceId, token, status } = body;

        if (iyziEventType !== "PAYMENT_RESULT") {
            // We only care about payment results for now
            console.log("Webhook ignored event", redactForLog({ iyziEventType, status }));
            return NextResponse.json({ status: "ignored" });
        }

        if (!token) {
            return NextResponse.json({ error: "MISSING_REQUIRED_PARAM" }, { status: 400 });
        }

        const payment = await prisma.paymentAttempt.findUnique({
            where: { token },
            include: { order: true }
        });

        if (!payment) {
            console.error("Webhook Error: Payment attempt not found.");
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // If already succeeded, nothing to do
        if (payment.status === "SUCCEEDED") {
            return NextResponse.json({ status: "already_processed" });
        }

        // Verify status with Iyzico Retrieve API for security (Background verification)
        const retrieveReq = {
            locale: "tr",
            conversationId: payment.orderId,
            token: token
        };

        const retrieveRes: any = await iyzicoCall<any>(iyzico.checkoutForm.retrieve.bind(iyzico.checkoutForm), retrieveReq);

        const isSuccess = retrieveRes.status === "success" && retrieveRes.paymentStatus === "SUCCESS";

        if (isSuccess) {
            // Commit stock and update order
            await finalizePayment({
                orderId: payment.orderId,
                paymentId: retrieveRes.paymentId,
                conversationId: retrieveRes.conversationId,
                rawResult: retrieveRes
            });

            console.log(`Webhook: Order ${payment.orderId} successfully updated via webhook.`);

            // Notifications are now handled in finalizePayment

            return NextResponse.json({ status: "success" });
        } else {
            // Note: We don't necessarily fail the order here because 
            // the user might still be on the payment page trying again (if allowed)
            // or we might just wait for expiration.
            // But if it's a definitive failure reported by Iyzico:
            console.log(`Webhook: Payment failed for token ${token}.`);
            return NextResponse.json({ status: "failed_notification_received" });
        }

    } catch (error: any) {
        console.error("Iyzico Webhook error:", error);
        return NextResponse.json({ error: "WEBHOOK_EXCEPTION" }, { status: 500 });
    }
}
