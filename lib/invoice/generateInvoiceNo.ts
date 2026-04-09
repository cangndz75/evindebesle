export function generateInvoiceNo() {
  const year = new Date().getFullYear();
  const serial = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0");
  return `DRK${year}${serial}`;
}
