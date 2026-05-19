import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { orchestrateInvoiceCreation } from "@/lib/services/invoice-orchestrator";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/orders/[id]/shipink-invoice
 * Admin panelinden manuel olarak e-Arşiv fatura oluşturma (HepsiFatura) ve müşteriye mail gönderme.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;

    const result = await orchestrateInvoiceCreation(orderId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Fatura oluşturulamadı.",
          ettn: result.ettn,
          pdfUrl: result.pdfUrl,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      ettn: result.ettn,
      pdfUrl: result.pdfUrl,
      invoiceNumber: result.invoiceNumber,
      emailSent: result.emailSent,
      shipinkUpdated: result.shipinkUpdated,
      ...(result.error ? { warning: result.error } : {}),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[POST shipink-invoice] Unhandled error:", message);

    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}
