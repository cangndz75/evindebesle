import { prisma } from "@/lib/db";
import { sendEArchiveInvoice, HepsiFaturaError } from "./hepsi-fatura";
import { sendShipinkInvoiceEmail } from "./invoice-email";
import { getShipinkAccessToken } from "@/lib/shipinkAuthService";
import { getShipinkApiBaseUrl } from "@/lib/shipinkApiBase";

export interface InvoiceOrchestrationResult {
  success: boolean;
  ettn: string | null;
  pdfUrl: string | null;
  invoiceNumber: string | null;
  emailSent: boolean;
  shipinkUpdated: boolean;
  error?: string;
}

/**
 * Sipariş faturalandırma akışını baştan sona yönetir:
 * 1. HepsiFatura API üzerinden e-Arşiv fatura oluştur
 * 2. PDF URL ve ETTN'i veritabanına kaydet
 * 3. Müşteriye premium tasarımlı e-posta gönder
 * 4. Shipink paneline fatura linkini bildir (köprü)
 */
export async function orchestrateInvoiceCreation(orderId: string): Promise<InvoiceOrchestrationResult> {
  let ettn: string | null = null;
  let pdfUrl: string | null = null;
  let invoiceNumber: string | null = null;
  let emailSent = false;
  let shipinkUpdated = false;

  // ADIM 1: HepsiFatura üzerinden e-Arşiv fatura kes
  try {
    const invoiceResult = await sendEArchiveInvoice(orderId);
    ettn = invoiceResult.ettn;
    pdfUrl = invoiceResult.pdfUrl;
    invoiceNumber = invoiceResult.invoiceNumber;
  } catch (error: unknown) {
    const message =
      error instanceof HepsiFaturaError
        ? `[${error.code}] ${error.message}`
        : error instanceof Error
          ? error.message
          : String(error);

    console.error(`[InvoiceOrchestrator] Fatura oluşturma hatası (orderId: ${orderId}):`, message);

    return {
      success: false,
      ettn: null,
      pdfUrl: null,
      invoiceNumber: null,
      emailSent: false,
      shipinkUpdated: false,
      error: message,
    };
  }

  if (!pdfUrl) {
    console.warn(`[InvoiceOrchestrator] Fatura oluşturuldu ancak PDF URL alınamadı. ETTN: ${ettn}`);
    return {
      success: true,
      ettn,
      pdfUrl: null,
      invoiceNumber,
      emailSent: false,
      shipinkUpdated: false,
      error: "PDF URL alınamadı, mail gönderilemedi.",
    };
  }

  // ADIM 2: Müşteriye e-posta gönder
  try {
    await sendShipinkInvoiceEmail({
      orderId,
      invoiceNumber: invoiceNumber || "",
      pdfUrl,
      ettn: ettn || "",
    });
    emailSent = true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[InvoiceOrchestrator] E-posta gönderim hatası (orderId: ${orderId}):`, message);
  }

  // ADIM 3: Shipink paneline fatura linkini bildir
  try {
    const orderData = await prisma.order.findUnique({
      where: { id: orderId },
      select: { shipinkOrderId: true },
    });

    if (orderData?.shipinkOrderId && pdfUrl) {
      const token = await getShipinkAccessToken();
      const base = getShipinkApiBaseUrl();

      const res = await fetch(`${base}/orders/${orderData.shipinkOrderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoice_url: pdfUrl,
          invoice_number: invoiceNumber || "",
        }),
      });

      if (res.ok) {
        shipinkUpdated = true;
        console.log(
          `[InvoiceOrchestrator] Shipink paneline fatura linki gönderildi: ${orderData.shipinkOrderId}`,
        );
      } else {
        const body = await res.text().catch(() => "");
        console.warn(
          `[InvoiceOrchestrator] Shipink fatura güncelleme ${res.status}: ${body.slice(0, 200)}`,
        );
      }
    }
  } catch (shipinkErr) {
    console.error(`[InvoiceOrchestrator] Shipink fatura güncelleme hatası:`, shipinkErr);
  }

  const warnings: string[] = [];
  if (!emailSent) warnings.push("E-posta gönderilemedi");
  if (!shipinkUpdated) warnings.push("Shipink paneli güncellenemedi");

  return {
    success: true,
    ettn,
    pdfUrl,
    invoiceNumber,
    emailSent,
    shipinkUpdated,
    ...(warnings.length > 0 ? { error: warnings.join("; ") } : {}),
  };
}
