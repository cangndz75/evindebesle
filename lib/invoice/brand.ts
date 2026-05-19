/** public/Logo- Türkçe.png */
export const INVOICE_BRAND_LOGO_SRC = "/Logo-%20T%C3%BCrk%C3%A7e.png";

export const DEFAULT_INVOICE_SIGNATURE_IMAGE_URL =
  "https://res.cloudinary.com/drb0agkvi/image/upload/v1779100598/WhatsApp_Image_2026-05-18_at_10.43.12_bpcp4i.jpg";

export function resolveInvoiceSignatureUrl(override?: string | null): string | null {
  if (override === null) return null;
  const fromEnv =
    typeof process !== "undefined" ? process.env.INVOICE_SIGNATURE_IMAGE_URL?.trim() : "";
  return override?.trim() || fromEnv || DEFAULT_INVOICE_SIGNATURE_IMAGE_URL;
}
