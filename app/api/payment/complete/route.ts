import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TAMI, tamiHeaders } from "@/lib/tami/config";
import { securityHashForComplete } from "@/lib/tami/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, orderId: bodyOrderId } = await req.json();

    let orderId = bodyOrderId as string | undefined;
    let ps: any = null;

    if (sessionId) {
      ps = await prisma.paymentSession.findUnique({ where: { id: sessionId } });
      if (!ps) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      if (ps.status !== "AUTH_OK") {
        return NextResponse.json({ error: "INVALID_STATE", status: ps.status }, { status: 400 });
      }
      orderId = ps.orderId ?? ps.id;
    } else if (!orderId) {
      return NextResponse.json({ error: "MISSING_ORDER_ID" }, { status: 400 });
    }

    const securityHash = securityHashForComplete(orderId!);

    const res = await fetch(`${TAMI.BASE_URL}/payment/complete-3ds`, {
      method: "POST",
      headers: tamiHeaders(),
      body: JSON.stringify({ orderId, securityHash }),
    });
    const data = await res.json().catch(() => ({}));
    const success = res.ok && data?.success !== false;

    if (sessionId) {
      await prisma.paymentSession.update({
        where: { id: sessionId },
        data: {
          status: success ? "CAPTURED" : "CAPTURE_FAIL",
          paymentId: data?.bankReferenceNumber ?? data?.correlationId ?? undefined,
          error: success ? undefined : (data?.errorMessage || "CAPTURE_FAILED"),
        },
      }).catch(() => null);
    }

    return NextResponse.json({ ok: success, detail: data }, { status: success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ error: "COMPLETE_EXCEPTION", detail: String(err?.message ?? err) }, { status: 500 });
  }
}
