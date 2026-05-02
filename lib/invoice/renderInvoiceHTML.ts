type OrderLike = {
  orderNumber: string;
  createdAt: string | Date;
};

type InvoiceItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
};

type InvoiceLike = {
  invoiceNumber: string;
  ettn: string;
  issuedAt: string | Date | null;
  dueDate: string | Date | null;
  scenario: string;
  type: string;
  customizationNo: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: InvoiceItem[];
  customerDetails: any;
};

type CompanyLike = {
  companyName?: string | null;
  companyAddress?: string | null;
  taxOffice?: string | null;
  taxNumber?: string | null;
  tradeRegistryNo?: string | null;
  ticaretSicilNo?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  website?: string | null;
};

interface InvoiceData {
  order: OrderLike;
  invoice: InvoiceLike;
  company: CompanyLike;
  qrDataUrl: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateTR(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function renderInvoiceHTML({ order, invoice, company, qrDataUrl }: InvoiceData): string {
  const customer = invoice.customerDetails || {};
  const customerName = customer.name || "-";
  const customerAddress =
    customer.addressText ||
    [
      customer.address?.district?.name,
      customer.address?.district?.city,
      customer.address?.fullAddress,
    ]
      .filter(Boolean)
      .join(" ");

  const tradeRegistryNo = company.tradeRegistryNo || company.ticaretSicilNo || "-";

  const rows = (invoice.items || [])
    .map((item, index) => {
      const taxRate = Number(item.taxRate ?? 20);
      const gross = Number(item.totalPrice || 0);
      const tax = gross - (gross * 100) / (100 + taxRate);
      const exTaxUnit = item.quantity > 0 ? (gross - tax) / item.quantity : 0;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.productName)}</td>
          <td class="text-right">${escapeHtml(item.quantity)} Adet</td>
          <td class="text-right">${formatMoney(exTaxUnit)} TL</td>
          <td class="text-center">%${taxRate.toFixed(2)}</td>
          <td class="text-right">${formatMoney(tax)} TL</td>
          <td class="text-right">${formatMoney(gross)} TL</td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fatura - ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #111;
      background: #fff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm;
    }
    .top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px dashed #d6b248;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .left, .right { width: 48%; }
    .title {
      font-size: 18px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 6px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 2px 6px;
      font-size: 10px;
    }
    .qr {
      width: 110px;
      height: 110px;
      border: 1px solid #ddd;
      padding: 4px;
      margin-left: auto;
      display: block;
    }
    .section-title {
      font-weight: 700;
      margin-bottom: 4px;
      font-size: 11px;
      text-transform: uppercase;
    }
    .small p { margin: 0 0 2px 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 10px;
    }
    th, td {
      border: 1px solid #d8d8d8;
      padding: 6px;
      vertical-align: top;
    }
    th {
      background: #f7f7f7;
      text-align: left;
      font-weight: 700;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals {
      width: 320px;
      margin-left: auto;
      margin-top: 8px;
      font-size: 10px;
    }
    .totals-row {
      display: grid;
      grid-template-columns: 1fr 110px;
      border: 1px solid #d8d8d8;
      border-top: none;
    }
    .totals-row:first-child { border-top: 1px solid #d8d8d8; }
    .totals-row > div { padding: 6px; }
    .totals-row > div:last-child { text-align: right; border-left: 1px solid #d8d8d8; }
    .totals-row.grand { font-weight: 700; background: #f7f7f7; }
    .footer {
      margin-top: 14px;
      border-top: 1px dashed #d6b248;
      padding-top: 8px;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="top">
      <div class="left small">
        <div class="section-title">Satıcı</div>
        <p><strong>${escapeHtml(company.companyName || "EVİNDEBESLE")}</strong></p>
        <p>${escapeHtml(company.companyAddress || "-")}</p>
        <p>Tel: ${escapeHtml(company.phone || "-")}</p>
        <p>E-Posta: ${escapeHtml(company.email || "-")}</p>
        <p>Web: ${escapeHtml(company.website || "-")}</p>
        <p>VD: ${escapeHtml(company.taxOffice || "-")}</p>
        <p>VKN: ${escapeHtml(company.taxNumber || "-")}</p>
        <p>Ticaret Sicil No: ${escapeHtml(tradeRegistryNo)}</p>
      </div>

      <div class="right">
        <div class="title">e-Arsiv Fatura</div>
        <img class="qr" src="${escapeHtml(qrDataUrl)}" alt="QR" />
        <div class="meta-grid">
          <div>Ozellestirme No</div><div>: ${escapeHtml(invoice.customizationNo)}</div>
          <div>Senaryo</div><div>: ${escapeHtml(invoice.scenario)}</div>
          <div>Fatura Tipi</div><div>: ${escapeHtml(invoice.type)}</div>
          <div>Fatura No</div><div>: ${escapeHtml(invoice.invoiceNumber)}</div>
          <div>Fatura Tarihi</div><div>: ${escapeHtml(formatDateTR(invoice.issuedAt))}</div>
          <div>Siparis No</div><div>: ${escapeHtml(order.orderNumber)}</div>
        </div>
      </div>
    </div>

    <div class="small" style="margin-bottom:8px;">
      <div class="section-title">Sayin</div>
      <p><strong>${escapeHtml(customerName)}</strong></p>
      <p>${escapeHtml(customerAddress || "-")}</p>
      <p>E-Posta: ${escapeHtml(customer.email || "-")}</p>
      <p>Tel: ${escapeHtml(customer.phone || "-")}</p>
      <p>TCKN/VKN: ${escapeHtml(customer.taxNumber || "-")}</p>
      <p>Vergi Dairesi: ${escapeHtml(customer.taxOffice || "-")}</p>
    </div>

    <div class="small" style="margin-bottom:8px;">
      <strong>ETTN:</strong> ${escapeHtml(invoice.ettn)}
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:40px;">Sira</th>
          <th>Aciklama</th>
          <th style="width:90px;">Miktar</th>
          <th style="width:110px;" class="text-right">Birim Fiyat</th>
          <th style="width:75px;" class="text-center">KDV Orani</th>
          <th style="width:100px;" class="text-right">KDV Tutari</th>
          <th style="width:105px;" class="text-right">Tutar</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><div>Ara Toplam</div><div>${formatMoney(invoice.subtotal)} TL</div></div>
      <div class="totals-row"><div>Hesaplanan KDV</div><div>${formatMoney(invoice.taxAmount)} TL</div></div>
      <div class="totals-row grand"><div>Odenecek Tutar</div><div>${formatMoney(invoice.totalAmount)} TL</div></div>
    </div>

    <div class="footer">
      <p>Bu satis internet uzerinden yapilmistir.</p>
      <p>E-Arsiv izin kapsaminda elektronik ortamda olusturulmustur.</p>
      <p>Son odeme tarihi: ${escapeHtml(formatDateTR(invoice.dueDate))}</p>
    </div>
  </div>
</body>
</html>
`;
}