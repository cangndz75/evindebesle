// app/api/payment/3ds-return/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PaymentSessionStatus } from "@prisma/client";
import { finalizeAppointmentFromDraftInternal } from "@/lib/payment";
import { securityHashForComplete } from "@/lib/tami/hash";
import { TAMI, tamiHeaders } from "@/lib/tami";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const sid = req.nextUrl.searchParams.get("sid") || "";
    const form = await req.formData();

    const success = String(form.get("success") || "").toLowerCase() === "true";
    const orderId = String(form.get("orderId") || "");
    const mdStatus = String(form.get("mdStatus") || "");
    const allEntries = Object.fromEntries(form.entries());

    const ps = await prisma.paymentSession.findFirst({ where: { orderId } });
    if (!ps) {
      return NextResponse.json({ error: "paymentSession not found" }, { status: 404 });
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
      return NextResponse.redirect(`${TAMI.APP_BASE_URL}/payment/3ds-result?sid=${ps.id}&status=fail`);
    }

    const payload = { orderId, securityHash: securityHashForComplete(orderId) };
    const capRes = await fetch(`${TAMI.BASE_URL}/payment/complete-3ds`, {
      method: "POST",
      headers: tamiHeaders(),
      body: JSON.stringify(payload),
    });
    const cap = await capRes.json().catch(() => ({}));

    if (!capRes.ok || !cap?.success) {
      await prisma.paymentSession.update({
        where: { id: ps.id },
        data: { status: PaymentSessionStatus.CAPTURE_FAIL, error: JSON.stringify(cap || {}) },
      });
      return NextResponse.redirect(`${TAMI.APP_BASE_URL}/payment/3ds-result?sid=${ps.id}&status=capture-fail`);
    }

    const appointment = await finalizeAppointmentFromDraftInternal({
      draftAppointmentId: ps.draftId!,
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

    return NextResponse.redirect(`${TAMI.APP_BASE_URL}/payment/3ds-result?sid=${ps.id}&status=ok&appointmentId=${appointment.id}`);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "callback error" }, { status: 500 });
  }
}
