export function generateInvoiceNo() {
  const now = new Date();
  const date = now.toISOString().split("T")[0].replace(/-/g, "");
  const random = Math.floor(10000 + Math.random() * 90000);
  return `FTR-${date}-${random}`;
}
