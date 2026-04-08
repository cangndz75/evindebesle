import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { iyzico, iyzicoCall } from "@/lib/iyzico";
import { releaseReservationTx } from "@/lib/stock";
import { finalizePayment } from "@/lib/services/payment";
import { redactForLog } from "@/lib/security/log";
import { verifyIyzicoWebhookSignature } from "@/lib/security/webhook-signature";

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signatureCheck = verifyIyzicoWebhookSignature(req, rawBody);
        if (!signatureCheck.ok) {
            console.warn("Webhook signature rejected", redactForLog(signatureCheck));
            return NextResponse.json({ error: "INVALID_WEBHOOK_SIGNATURE" }, { status: 401 });
        }

        const body = JSON.parse(rawBody);

        const { iyziEventType, iyziReferenceId, token, status } = body;

        if (iyziEventType !== "PAYMENT_RESULT") {
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

        if (payment.status === "SUCCEEDED") {
            return NextResponse.json({ status: "already_processed" });
        }

        const retrieveReq = {
            locale: "tr",
            conversationId: payment.orderId,
            token: token
        };

        const retrieveRes: any = await iyzicoCall<any>(iyzico.checkoutForm.retrieve.bind(iyzico.checkoutForm), retrieveReq);

        const isSuccess = retrieveRes.status === "success" && retrieveRes.paymentStatus === "SUCCESS";

        if (isSuccess) {
            await finalizePayment({
                orderId: payment.orderId,
                paymentId: retrieveRes.paymentId,
                conversationId: retrieveRes.conversationId,
                rawResult: retrieveRes
            });

            console.log(`Webhook: Order ${payment.orderId} successfully updated via webhook.`);


            return NextResponse.json({ status: "success" });
        } else {
            await releaseReservationTx(payment.orderId);

            await prisma.$transaction([
                prisma.order.update({
                    where: { id: payment.orderId },
                    data: { status: "PAYMENT_FAILED" },
                }),
                prisma.paymentAttempt.update({
                    where: { id: payment.id },
                    data: {
                        status: "FAILED",
                        rawResult: retrieveRes,
                    },
                }),
            ]);

            console.log(`Webhook: Payment failed for token ${token}.`);
            return NextResponse.json({ status: "failed_notification_received" });
        }

    } catch (error: any) {
        console.error("Iyzico Webhook error:", error);
        return NextResponse.json({ error: "WEBHOOK_EXCEPTION" }, { status: 500 });
    }
}
