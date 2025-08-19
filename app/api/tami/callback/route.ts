import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TAMI, generateJWKSignature, tamiHeaders } from "@/lib/tami";
import { PaymentSessionStatus } from "@/lib/generated/prisma";
import { finalizeAppointmentFromDraftInternal } from "@/lib/payment";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const success = String(form.get("success") || "").toLowerCase() === "true";
    const orderId = String(form.get("orderId") || "");
    const mdStatus = String(form.get("mdStatus") || "");
    const systemTime = String(form.get("systemTime") || "");
    const maskedNumber = String(form.get("maskedNumber") || "");
    const allEntries = Object.fromEntries(form.entries());

    const ps = await prisma.paymentSession.findFirst({ where: { orderId } });
    if (!ps) {
      return NextResponse.json({ error: "paymentSession bulunamadı" }, { status: 404 });
    }

    await prisma.paymentSession.update({
      where: { id: ps.id },
      data: {
        status: success ? PaymentSessionStatus.AUTH_OK : PaymentSessionStatus.FAILED,
        mdStatus,
        success,
        threeDSResultRaw: JSON.stringify(allEntries),
      },
    });

    if (!success) {
      const url = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_BASE_URL}/payment/3ds-result?sid=${ps.id}&status=fail`;
      return NextResponse.redirect(url);
    }

    const payload = { orderId };
    const securityHash = generateJWKSignature(payload);
    const capRes = await fetch(`${TAMI.baseURL}/payment/complete-3ds`, {
      method: "POST",
      headers: tamiHeaders(),
      body: JSON.stringify({ ...payload, securityHash }),
    });
    const cap = await capRes.json().catch(() => ({}));

    if (!capRes.ok || !cap?.success) {
      await prisma.paymentSession.update({
        where: { id: ps.id },
        data: { status: PaymentSessionStatus.CAPTURE_FAIL, error: JSON.stringify(cap || {}) },
      });
      const url = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_BASE_URL}/payment/3ds-result?sid=${ps.id}&status=capture-fail`;
      return NextResponse.redirect(url);
    }

    const appointment = await finalizeAppointmentFromDraftInternal({
      draftAppointmentId: ps.draftAppointmentId,
      userId: ps.userId,
      paidPrice: ps.amount,
      conversationId: cap.correlationId || "TAMI-3DS",
      paymentId: cap.orderId || orderId,
    });

    await prisma.paymentSession.update({
      where: { id: ps.id },
      data: {
        status: PaymentSessionStatus.CAPTURED,
        appointmentId: appointment.id,
        paymentId: cap.orderId || orderId,
      },
    });

    const url = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_BASE_URL}/success?appointmentId=${appointment.id}`;
    return NextResponse.redirect(url);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "callback error" }, { status: 500 });
  }
}
