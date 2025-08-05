import { v4 as uuidv4 } from "uuid";

export function generateInvoiceHtml({
  user,
  appointment,
  services,
  totalPrice,
  invoiceNo,
}: {
  user: { name: string; email: string };
  appointment: { id: string; confirmedAt: Date };
  services: { name: string; price: number }[];
  totalPrice: number;
  invoiceNo: string;
}) {
  const ettn = uuidv4().toUpperCase();
  const kdvOran = 0.20;
  const kdvToplam = services.reduce((sum, s) => sum + s.price * kdvOran, 0);
  const odenecek = totalPrice + kdvToplam;

  const rows = services
    .map((s, i) => {
      const kdv = s.price * kdvOran;
      return `<tr><td>${i + 1}</td><td>${s.name}</td><td>1</td><td>${s.price.toFixed(
        2
      )}₺</td><td>%20</td><td>${kdv.toFixed(2)}₺</td><td>${(s.price + kdv).toFixed(
        2
      )}₺</td></tr>`;
    })
    .join("");

  return `
    <html><body>
    <h2>EvindeBesle - E-Arşiv Fatura</h2>
    <p>Müşteri: ${user.name} (${user.email})</p>
    <p>Fatura No: ${invoiceNo}</p>
    <p>ETTN: ${ettn}</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><th>#</th><th>Hizmet</th><th>Miktar</th><th>Birim</th><th>KDV</th><th>KDV Tutar</th><th>Toplam</th></tr>
      ${rows}
      <tr><td colspan="5">Toplam KDV</td><td colspan="2">${kdvToplam.toFixed(2)}₺</td></tr>
      <tr><td colspan="5"><strong>Genel Toplam</strong></td><td colspan="2"><strong>${odenecek.toFixed(2)}₺</strong></td></tr>
    </table>
    </body></html>
  `;
}
