import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { securityHashForComplete, verify3DHashedData } from "@/lib/tami/hash";
import { TAMI, tamiHeaders } from "@/lib/tami/config";
import { PaymentSessionStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid") || "";
  const form = await req.formData();

  const rawSuccess = String(form.get("success") ?? form.get("status") ?? "");
  const mdStatus = String(form.get("mdStatus") ?? "");
  const verify = verify3DHashedData(form);
  const ok = ["true", "1", "ok"].includes(rawSuccess.toLowerCase()) && verify.ok;

  let status: PaymentSessionStatus = ok
    ? PaymentSessionStatus.AUTH_OK
    : PaymentSessionStatus.FAILED;

  if (sid) {
    const ps = await prisma.paymentSession
      .update({
        where: { id: sid },
        data: {
          status,
          success: ok,
          mdStatus,
          orderId: String(form.get("orderId") ?? undefined) || undefined,
          threeDSResultRaw: JSON.stringify(Object.fromEntries(form.entries())),
          error: !verify.ok
            ? "HASH_MISMATCH"
            : String(form.get("errorMessage") ?? undefined) || undefined,
        },
      })
      .catch(() => null);

    if (ps && ok && ps.orderId) {
      const payload = {
        orderId: ps.orderId,
        securityHash: securityHashForComplete(ps.orderId),
      };

      const res = await fetch(`${TAMI.BASE_URL}/payment/complete-3ds`, {
        method: "POST",
        headers: tamiHeaders(ps.correlationId || undefined),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success !== false) {
        await prisma.paymentSession.update({
          where: { id: ps.id },
          data: {
            status: PaymentSessionStatus.CAPTURED,
            paymentId: data?.bankReferenceNumber ?? data?.orderId ?? undefined,
          },
        });
        status = PaymentSessionStatus.CAPTURED;
      } else {
        await prisma.paymentSession.update({
          where: { id: ps.id },
          data: {
            status: PaymentSessionStatus.CAPTURE_FAIL,
            error: data?.errorMessage || "CAPTURE_FAILED",
          },
        });
        status = PaymentSessionStatus.CAPTURE_FAIL;
      }
    }
  }

  const url = new URL(`/payment/3ds-result?sid=${sid}&status=${status}`, req.nextUrl);

  return NextResponse.redirect(url, { status: 303 });
}
