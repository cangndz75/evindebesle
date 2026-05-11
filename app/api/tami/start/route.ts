import { NextRequest, NextResponse } from "next/server";
import { detectCardDataInPayload } from "@/lib/security/pci";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const input = await req.json().catch(() => ({}));
    const findings = detectCardDataInPayload(input);

    return NextResponse.json(
      {
        error: "PCI_DSS_VIOLATION",
        message:
          "Doğrudan kart verisi alan TAMI endpoint'i devre dışı bırakıldı. Hosted checkout/tokenization akışını kullanın.",
        rejectedFields: findings.slice(0, 5),
      },
      { status: 410 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "PCI_DSS_VIOLATION",
        message:
          "Doğrudan kart verisi alan TAMI endpoint'i devre dışı bırakıldı. Hosted checkout/tokenization akışını kullanın.",
      },
      { status: 410 }
    );
  }
}
