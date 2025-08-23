import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TAMI, tamiHeaders } from "@/lib/tami/config";
import { securityHashForComplete } from "@/lib/tami/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body ?? {};
    if (!sessionId) {
      return NextResponse.json({ error: "MISSING_SESSION_ID" }, { status: 400 });
    }

    const ps = await prisma.paymentSession.findUnique({
      where: { id: sessionId },
    });
    if (!ps) {
      return NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
    }
    if (ps.status !== "AUTH_OK") {
      return NextResponse.json(
        { error: "INVALID_STATUS", current: ps.status },
        { status: 400 }
      );
    }

    // 🔑 securityHash → orderId + secretKey
    const securityHash = securityHashForComplete(ps.orderId!);

    const payload = {
      orderId: ps.orderId,
      securityHash,
    };

    // 👉 Tami çağrısı
    const res = await fetch(`${TAMI.BASE_URL}/payment/complete-3ds`, {
      method: "POST",
      headers: tamiHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success === false) {
      await prisma.paymentSession.update({
        where: { id: sessionId },
        data: {
          status: "CAPTURE_FAIL",
          error: data?.errorMessage || "CAPTURE_FAILED",
        },
      });
      return NextResponse.json(
        { error: "CAPTURE_FAILED", detail: data },
        { status: 400 }
      );
    }

    // 📝 Appointment oluştur (Draft ile bağla)
    const appointment = await prisma.appointment.create({
      data: {
        userId: ps.userId,
        draftId: ps.draftId,
        isPaid: true,
        paidAt: new Date(),
        finalPrice: ps.amount ? ps.amount / 100 : undefined,
        paymentId: data?.bankReferenceNumber ?? data?.orderId ?? undefined,
        paymentConversationId: data?.correlationId ?? undefined,
      },
    });

    await prisma.paymentSession.update({
      where: { id: sessionId },
      data: {
        status: "CAPTURED",
        appointmentId: appointment.id,
        paymentId: data?.bankReferenceNumber ?? data?.orderId ?? undefined,
      },
    });

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      orderId: ps.orderId,
      bankAuthCode: data?.bankAuthCode,
      bankReferenceNumber: data?.bankReferenceNumber,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "COMPLETE_EXCEPTION", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
