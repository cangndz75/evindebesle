import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { refreshShipinkOrderAddress } from "@/lib/jobs/syncOrdersToShipink";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/orders/[id]/shipink-address
 * Mevcut Shipink siparişinde il/ilçe adresini veritabanından yeniden gönderir.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;
    const updated = await refreshShipinkOrderAddress(orderId);

    if (!updated) {
      return NextResponse.json(
        { error: "Shipink siparişi bulunamadı veya adres güncellenemedi." },
        { status: 422 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[POST shipink-address]", message);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}
