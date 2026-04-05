import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { iyzico, iyzicoCall } from "@/lib/iyzico";
import { commitReservationToSaleTx, releaseReservationTx } from "@/lib/stock";
import { finalizePayment } from "@/lib/services/payment";

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const orderId = url.searchParams.get("orderId");

        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        const contentType = req.headers.get("content-type") || "";
        let token: string | null = null;

        if (contentType.includes("application/json")) {
            const body = await req.json();
            token = body?.token ?? null;
        } else {
            const formData = await req.formData();
            token = (formData.get("token") as string) || null;
        }

        if (!token) {
            return NextResponse.json({ error: "MISSING_REQUIRED_PARAM" }, { status: 400 });
        }

        const payment = await prisma.paymentAttempt.findUnique({
            where: { orderId },
            include: { order: true }
        });

        if (!payment) {
            return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
        }

        if (payment.status === "SUCCEEDED") {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/checkout/success?orderId=${orderId}`);
        }

        await prisma.paymentAttempt.update({
            where: { orderId },
            data: { status: "CALLBACK_RECEIVED", token }
        });

        const retrieveReq = {
            locale: "tr",
            conversationId: orderId,
            token: token
        };

        const retrieveRes: any = await iyzicoCall<any>(iyzico.checkoutForm.retrieve.bind(iyzico.checkoutForm), retrieveReq);

        const isSuccess = retrieveRes.status === "success" && retrieveRes.paymentStatus === "SUCCESS";

        if (isSuccess) {
            await finalizePayment({
                orderId,
                paymentId: retrieveRes.paymentId,
                conversationId: retrieveRes.conversationId,
                rawResult: retrieveRes
            });

            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/checkout/success?orderId=${orderId}`);
        } else {
            await releaseReservationTx(orderId);

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

            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/checkout/success?orderId=${orderId}&error=payment_failed`);
        }

    } catch (error: any) {
        console.error("Iyzico Callback error:", error);
        return NextResponse.json({ error: "CALLBACK_EXCEPTION" }, { status: 500 });
    }
}
