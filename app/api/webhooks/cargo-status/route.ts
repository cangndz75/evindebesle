import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { applyCargoStatusWebhook } from "@/lib/services/cargo";

function verifyCargoWebhookSignature(req: NextRequest, rawBody: string): boolean {
  const sharedSecret = process.env.CARGO_WEBHOOK_SECRET;
  if (!sharedSecret) return false;

  const signatureHeader =
    req.headers.get("x-cargo-signature") || req.headers.get("x-webhook-signature") || "";
  const signature = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice("sha256=".length)
    : signatureHeader;
  if (!signature) return false;

  const timestamp = req.headers.get("x-cargo-timestamp") || "";

  const expectedWithTimestamp = timestamp
    ? createHmac("sha256", sharedSecret).update(`${timestamp}.${rawBody}`).digest("hex")
    : "";
  const expectedRawBody = createHmac("sha256", sharedSecret).update(rawBody).digest("hex");

  const sigBuf = Buffer.from(signature, "utf8");
  const expectedCandidates = [expectedWithTimestamp, expectedRawBody].filter(Boolean);

  return expectedCandidates.some((candidate) => {
    const expectedBuf = Buffer.from(candidate, "utf8");
    return expectedBuf.length === sigBuf.length && timingSafeEqual(expectedBuf, sigBuf);
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!verifyCargoWebhookSignature(req, rawBody)) {
      return NextResponse.json({ error: "INVALID_WEBHOOK_SIGNATURE" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || "{}");
    const result = await applyCargoStatusWebhook({ payload });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[CARGO_STATUS_WEBHOOK]", error);
    return NextResponse.json(
      { error: "WEBHOOK_EXCEPTION" },
      { status: 500 }
    );
  }
}
