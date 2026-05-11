import { NextRequest, NextResponse } from "next/server";
import { POST as checkoutInitializePost } from "@/app/api/checkout/initialize/route";
import { detectCardDataInPayload } from "@/lib/security/pci";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clonedReq = req.clone();
  const body = await clonedReq.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_REQUEST_BODY" }, { status: 400 });
  }

  const findings = detectCardDataInPayload(body);
  if (findings.length > 0) {
    return NextResponse.json(
      {
        error: "PCI_DSS_VIOLATION",
        message: "Doğrudan kart verisi gönderimi yasaktır. Hosted checkout akışını kullanın.",
        rejectedFields: findings.slice(0, 5),
      },
      { status: 400 }
    );
  }

  return checkoutInitializePost(req);
}
