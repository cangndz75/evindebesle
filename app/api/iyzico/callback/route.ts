import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { iyzico, iyzicoCall } from "@/lib/iyzico";
import { commitReservationToSaleTx, releaseReservationTx } from "@/lib/stock";
import { finalizePayment } from "@/lib/services/payment";
import { tryPushPaidOrderToShipink } from "@/lib/jobs/syncOrdersToShipink";

const isDebugEnabled = process.env.IYZICO_DEBUG === "1" || process.env.IYZICO_DEBUG === "true";

function callbackDebug(stage: string, payload: Record<string, unknown>) {
    if (!isDebugEnabled) return;
    console.log("[IYZICO_CALLBACK_DEBUG]", stage, payload);
}

async function handleCallback(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const orderId = url.searchParams.get("orderId");
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || url.origin).replace(/\/$/, "");

        callbackDebug("entry", {
            method: req.method,
            path: url.pathname,
            hasOrderId: Boolean(orderId),
            queryKeys: Array.from(url.searchParams.keys()),
            contentType: req.headers.get("content-type") || "",
        });

        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        const contentType = req.headers.get("content-type") || "";
        let token: string | null = url.searchParams.get("token");

        callbackDebug("token_from_query", {
            hasToken: Boolean(token),
            tokenLength: token?.length || 0,
        });

        if (!token && contentType.includes("application/json")) {
            const body = await req.json();
            token = body?.token ?? null;
            callbackDebug("token_from_json", {
                bodyKeys: body && typeof body === "object" ? Object.keys(body) : [],
                hasToken: Boolean(token),
                tokenLength: token?.length || 0,
            });
        } else if (!token) {
            const formData = await req.formData();
            token = (formData.get("token") as string) || null;
            callbackDebug("token_from_form", {
                formKeys: Array.from(formData.keys()),
                hasToken: Boolean(token),
                tokenLength: token?.length || 0,
            });
        }

        if (!token) {
            return NextResponse.json({ error: "MISSING_REQUIRED_PARAM" }, { status: 400 });
        }

        const payment = await prisma.paymentAttempt.findUnique({
            where: { orderId },
            include: { order: true }
        });

        callbackDebug("payment_lookup", {
            found: Boolean(payment),
            paymentStatus: payment?.status || null,
            orderStatus: payment?.order?.status || null,
            hasSavedToken: Boolean(payment?.token),
        });

        if (!payment) {
            return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
        }

        if (payment.token && payment.token !== token) {
            callbackDebug("token_mismatch", {
                orderId,
                hasSavedToken: true,
                incomingTokenLength: token.length,
                savedTokenLength: payment.token.length,
            });
            return NextResponse.json({ error: "TOKEN_ORDER_MISMATCH" }, { status: 400 });
        }

        if (payment.status === "SUCCEEDED") {
            void tryPushPaidOrderToShipink(orderId).catch((err) => {
                console.error(`[IYZICO_CALLBACK] Shipink anlık senkronizasyon (${orderId}):`, err);
            });
            return NextResponse.redirect(`${baseUrl}/checkout/success?orderId=${orderId}`, 303);
        }

        await prisma.paymentAttempt.update({
            where: { orderId },
            data: { status: "CALLBACK_RECEIVED", token }
        });

        callbackDebug("payment_updated", {
            orderId,
            callbackStatus: "CALLBACK_RECEIVED",
            tokenLength: token.length,
        });

        const retrieveReq = {
            locale: "tr",
            conversationId: orderId,
            token: token
        };

        callbackDebug("retrieve_request", {
            conversationId: retrieveReq.conversationId,
            tokenLength: retrieveReq.token.length,
        });

        const retrieveRes: any = await iyzicoCall<any>(iyzico.checkoutForm.retrieve.bind(iyzico.checkoutForm), retrieveReq);

        callbackDebug("retrieve_response", {
            status: retrieveRes?.status || null,
            paymentStatus: retrieveRes?.paymentStatus || null,
            errorCode: retrieveRes?.errorCode || null,
            errorMessage: retrieveRes?.errorMessage || null,
            paymentId: retrieveRes?.paymentId || null,
            conversationId: retrieveRes?.conversationId || null,
            mdStatus: retrieveRes?.mdStatus ?? null,
        });

        const isSuccess = retrieveRes.status === "success" && retrieveRes.paymentStatus === "SUCCESS";

        if (isSuccess) {
            await finalizePayment({
                orderId,
                paymentId: retrieveRes.paymentId,
                conversationId: retrieveRes.conversationId,
                rawResult: retrieveRes
            });

            void tryPushPaidOrderToShipink(orderId).catch((err) => {
                console.error(`[IYZICO_CALLBACK] Shipink anlık senkronizasyon (${orderId}):`, err);
            });

            callbackDebug("finalize_success", {
                orderId,
                paymentId: retrieveRes.paymentId || null,
                conversationId: retrieveRes.conversationId || null,
            });

            return NextResponse.redirect(`${baseUrl}/checkout/success?orderId=${orderId}`, 303);
        } else {
            await releaseReservationTx(orderId);

            callbackDebug("finalize_failed", {
                orderId,
                retrieveStatus: retrieveRes?.status || null,
                retrievePaymentStatus: retrieveRes?.paymentStatus || null,
                retrieveErrorCode: retrieveRes?.errorCode || null,
            });

            await prisma.$transaction([
                prisma.order.update({
                    where: { id: orderId },
                    data: { status: "PAYMENT_FAILED" }
                }),
                prisma.paymentAttempt.update({
                    where: { orderId },
                    data: {
                        status: "FAILED",
                        rawResult: retrieveRes
                    }
                })
            ]);

            return NextResponse.redirect(`${baseUrl}/checkout/success?orderId=${orderId}&error=payment_failed`, 303);
        }

    } catch (error: any) {
        callbackDebug("exception", {
            message: error?.message || "unknown",
            stackTop: typeof error?.stack === "string" ? error.stack.split("\n").slice(0, 2).join(" | ") : null,
        });
        console.error("Iyzico Callback error:", error);
        return NextResponse.json({ error: "CALLBACK_EXCEPTION" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    return handleCallback(req);
}

export async function GET(req: NextRequest) {
    return handleCallback(req);
}
