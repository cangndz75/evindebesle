import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verify3DHashedData } from "@/lib/tami/hash";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid") || "";
  const form = await req.formData();

  const rawSuccess = String(form.get("success") ?? form.get("status") ?? "");
  const ok = ["true", "1", "ok"].includes(rawSuccess.toLowerCase());
  const mdStatus = String(form.get("mdStatus") ?? "");

  const verify = verify3DHashedData(form);

  if (sid) {
    await prisma.paymentSession.update({
      where: { id: sid },
      data: {
        status: ok ? "AUTH_OK" : "FAILED",
        success: ok,
        mdStatus,
        orderId: String(form.get("orderId") ?? undefined) || undefined,
        threeDSResultRaw: JSON.stringify(Object.fromEntries(form.entries())),
        error: verify.ok ? undefined : "HASH_MISMATCH",
      },
    }).catch(() => null);
  }

  const url = new URL(`/payment/result?sid=${sid}&status=${ok ? "ok" : "fail"}`, req.nextUrl);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const url = new URL(`/payment/result?${req.nextUrl.searchParams}`, req.nextUrl);
  return NextResponse.redirect(url);
}
