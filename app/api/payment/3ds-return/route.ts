import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verify3DHashedData, securityHashForComplete } from "@/lib/tami/hash";
import { TAMI, tamiHeaders } from "@/lib/tami/config";
import { PaymentSessionStatus } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid") || "";
  const form = await req.formData();

  const rawSuccess = String(form.get("success") ?? form.get("status") ?? "");
  const mdStatus = String(form.get("mdStatus") ?? "");
  const verify = verify3DHashedData(form);

  const ok =
    ["true", "1", "ok"].includes(rawSuccess.toLowerCase()) && verify.ok;

  let status: PaymentSessionStatus = ok
    ? PaymentSessionStatus.AUTH_OK
    : PaymentSessionStatus.FAILED;
  let error: string | undefined;
  let appointmentId: string | undefined;

  if (!verify.ok) error = "HASH_MISMATCH";
  if (!ok) error = String(form.get("errorMessage") ?? undefined) || undefined;

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
          error,
        },
      })
      .catch(() => null);

    if (ps && ok) {
      try {
        const securityHash = securityHashForComplete(ps.orderId!);
        const payload = { orderId: ps.orderId, securityHash };

        const res = await fetch(`${TAMI.BASE_URL}/payment/complete-3ds`, {
          method: "POST",
          headers: tamiHeaders(),
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.success !== false) {
          const appointment = await prisma.appointment.create({
            data: {
              userId: ps.userId,
              draftId: ps.draftId,   // ✅ düzeltildi
              isPaid: true,
              paidAt: new Date(),
            },
          });

          await prisma.paymentSession.update({
            where: { id: ps.id },
            data: {
              status: PaymentSessionStatus.CAPTURED,
              appointmentId: appointment.id,
              paymentId:
                data?.bankReferenceNumber ?? data?.orderId ?? undefined,
            },
          });

          appointmentId = appointment.id;
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
      } catch (err: any) {
        await prisma.paymentSession.update({
          where: { id: sid },
          data: {
            status: PaymentSessionStatus.FAILED,
            error: String(err?.message ?? err),
          },
        });
        status = PaymentSessionStatus.FAILED;
      }
    }
  }

  
  const url = new URL(
    `/payment/3ds-result?sid=${sid}&status=${status}${
      appointmentId ? `&appointmentId=${appointmentId}` : ""
    }`,
    req.nextUrl
  );

  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const url = new URL(
    `/payment/3ds-result?${req.nextUrl.searchParams}`,
    req.nextUrl
  );
  return NextResponse.redirect(url);
}
