import { createShipinkInvoice, ShipinkInvoiceServiceError } from "./shipink-invoice";
import { sendShipinkInvoiceEmail } from "./invoice-email";

export interface InvoiceOrchestrationResult {
  success: boolean;
  ettn: string | null;
  pdfUrl: string | null;
  invoiceNumber: string | null;
  emailSent: boolean;
  error?: string;
}

/**
 * Sipariş faturalandırma akışını baştan sona yönetir:
 * 1. Shipink API üzerinden e-Arşiv fatura oluştur
 * 2. PDF URL ve ETTN'i veritabanına kaydet
 * 3. Müşteriye premium tasarımlı e-posta gönder
 *
 * Her aşamada hata yakalanır; bir adım başarısız olursa
 * sonraki adımlar için uygun aksiyonlar alınır.
 */
export async function orchestrateInvoiceCreation(orderId: string): Promise<InvoiceOrchestrationResult> {
  let ettn: string | null = null;
  let pdfUrl: string | null = null;
  let invoiceNumber: string | null = null;
  let emailSent = false;

  // ADIM 1: Shipink üzerinden fatura oluştur
  try {
    const invoiceResult = await createShipinkInvoice(orderId);
    ettn = invoiceResult.ettn;
    pdfUrl = invoiceResult.pdfUrl;
    invoiceNumber = invoiceResult.invoiceNumber;
  } catch (error: unknown) {
    const message =
      error instanceof ShipinkInvoiceServiceError
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
      error: message,
    };
  }

  // ADIM 2: PDF URL yoksa mail göndermeyiz ama kısmi başarı döneriz
  if (!pdfUrl) {
    console.warn(`[InvoiceOrchestrator] Fatura oluşturuldu ancak PDF URL alınamadı. ETTN: ${ettn}`);
    return {
      success: true,
      ettn,
      pdfUrl: null,
      invoiceNumber,
      emailSent: false,
      error: "PDF URL alınamadı, mail gönderilemedi.",
    };
  }

  // ADIM 3: Müşteriye e-posta gönder
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

    return {
      success: true,
      ettn,
      pdfUrl,
      invoiceNumber,
      emailSent: false,
      error: `Fatura oluşturuldu ancak e-posta gönderilemedi: ${message}`,
    };
  }

  return {
    success: true,
    ettn,
    pdfUrl,
    invoiceNumber,
    emailSent,
  };
}
