interface InvoiceData {
    order: any;
    company: {
        companyName?: string | null;
        companyAddress?: string | null;
        taxOffice?: string | null;
        taxNumber?: string | null;
        phone?: string | null;
        email?: string | null;
        logoUrl?: string | null;
        website?: string | null;
    };
}

export function renderInvoiceHTML({ order, company }: InvoiceData): string {
    const invoiceDate = new Date(order.createdAt).toLocaleDateString("tr-TR");
    const paidDate = order.paidAt
        ? new Date(order.paidAt).toLocaleDateString("tr-TR")
        : invoiceDate;

    const taxRate = 0.20;
    const subtotalWithoutTax = order.subtotal / (1 + taxRate);
    const taxAmount = order.subtotal - subtotalWithoutTax;

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fatura - ${order.orderNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      font-size: 11pt;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
    }
    
    .logo {
      flex: 1;
    }
    
    .logo img {
      max-width: 150px;
      height: auto;
    }
    
    .company-info {
      flex: 1;
      text-align: right;
      font-size: 9pt;
    }
    
    .company-info h1 {
      font-size: 18pt;
      margin-bottom: 10px;
      color: #000;
    }
    
    .invoice-title {
      text-align: center;
      font-size: 24pt;
      font-weight: bold;
      margin: 30px 0;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .invoice-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 20px;
    }
    
    .invoice-meta-item {
      flex: 1;
    }
    
    .invoice-meta-item strong {
      display: block;
      margin-bottom: 5px;
      color: #666;
      font-size: 9pt;
      text-transform: uppercase;
    }
    
    .addresses {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-bottom: 40px;
    }
    
    .address-box {
      flex: 1;
      border: 1px solid #ddd;
      padding: 15px;
      background: #f9f9f9;
    }
    
    .address-box h3 {
      font-size: 11pt;
      margin-bottom: 10px;
      color: #000;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    
    .address-box p {
      font-size: 10pt;
      margin: 5px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    thead {
      background: #000;
      color: white;
    }
    
    th {
      padding: 12px 8px;
      text-align: left;
      font-size: 10pt;
      font-weight: 600;
    }
    
    th.text-right, td.text-right {
      text-align: right;
    }
    
    th.text-center, td.text-center {
      text-align: center;
    }
    
    tbody tr {
      border-bottom: 1px solid #eee;
    }
    
    tbody tr:hover {
      background: #f9f9f9;
    }
    
    td {
      padding: 10px 8px;
      font-size: 10pt;
    }
    
    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 20px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 10pt;
    }
    
    .totals-row.subtotal {
      border-top: 1px solid #ddd;
    }
    
    .totals-row.total {
      border-top: 2px solid #000;
      font-weight: bold;
      font-size: 13pt;
      padding: 12px 0;
      margin-top: 5px;
    }
    
    .footer {
      margin-top: 60px;
      text-align: center;
      font-size: 9pt;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
    
    .footer p {
      margin: 5px 0;
    }
    
    .notes {
      margin-top: 30px;
      padding: 15px;
      background: #f0f0f0;
      border-left: 4px solid #000;
      font-size: 9pt;
    }
    
    .notes strong {
      display: block;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        ${company.logoUrl
            ? `<img src="${company.logoUrl}" alt="${company.companyName || "Logo"}" />`
            : `<h1>${company.companyName || "Dark Velvet"}</h1>`
        }
      </div>
      <div class="company-info">
        <h1>${company.companyName || "Dark Velvet"}</h1>
        ${company.companyAddress ? `<p>${company.companyAddress}</p>` : ""}
        ${company.taxOffice ? `<p>Vergi Dairesi: ${company.taxOffice}</p>` : ""}
        ${company.taxNumber ? `<p>Vergi No: ${company.taxNumber}</p>` : ""}
        ${company.phone ? `<p>Tel: ${company.phone}</p>` : ""}
        ${company.email ? `<p>Email: ${company.email}</p>` : ""}
        ${company.website ? `<p>${company.website}</p>` : ""}
      </div>
    </div>
    
    <!-- Invoice Title -->
    <div class="invoice-title">FATURA</div>
    
    <!-- Invoice Meta -->
    <div class="invoice-meta">
      <div class="invoice-meta-item">
        <strong>Fatura No:</strong>
        <span>${order.orderNumber}</span>
      </div>
      <div class="invoice-meta-item">
        <strong>Fatura Tarihi:</strong>
        <span>${invoiceDate}</span>
      </div>
      <div class="invoice-meta-item">
        <strong>Ödeme Tarihi:</strong>
        <span>${paidDate}</span>
      </div>
    </div>
    
    <!-- Addresses -->
    <div class="addresses">
      <div class="address-box">
        <h3>Fatura Edilen</h3>
        <p><strong>${order.user.name}</strong></p>
        <p>${order.user.email || ""}</p>
        ${order.billingAddress
            ? `
          <p>${order.billingAddress.fullAddress}</p>
          <p>${order.billingAddress.district.name}, ${order.billingAddress.district.city}</p>
        `
            : ""
        }
      </div>
      <div class="address-box">
        <h3>Teslimat Adresi</h3>
        ${order.shippingAddress
            ? `
          <p>${order.shippingAddress.fullAddress}</p>
          <p>${order.shippingAddress.district.name}, ${order.shippingAddress.district.city}</p>
        `
            : "<p>Fatura adresi ile aynı</p>"
        }
        ${order.trackingNumber ? `<p><strong>Kargo Takip:</strong> ${order.trackingNumber}</p>` : ""}
      </div>
    </div>
    
    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th>Ürün</th>
          <th class="text-center">Renk/Beden</th>
          <th class="text-center">Adet</th>
          <th class="text-right">Birim Fiyat</th>
          <th class="text-right">Toplam</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
            .map(
                (item: any) => `
          <tr>
            <td>${item.productName}</td>
            <td class="text-center">
              ${item.colorName || ""} ${item.colorName && item.sizeName ? "/" : ""} ${item.sizeName || ""}
            </td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">${item.unitPrice.toFixed(2)} ₺</td>
            <td class="text-right">${item.totalPrice.toFixed(2)} ₺</td>
          </tr>
        `
            )
            .join("")}
      </tbody>
    </table>
    
    <!-- Totals -->
    <div class="totals">
      <div class="totals-row subtotal">
        <span>Ara Toplam (KDV Hariç):</span>
        <span>${subtotalWithoutTax.toFixed(2)} ₺</span>
      </div>
      <div class="totals-row">
        <span>KDV (%20):</span>
        <span>${taxAmount.toFixed(2)} ₺</span>
      </div>
      <div class="totals-row">
        <span>Kargo:</span>
        <span>${order.shippingCost.toFixed(2)} ₺</span>
      </div>
      ${order.discount > 0
            ? `
        <div class="totals-row">
          <span>İndirim:</span>
          <span>-${order.discount.toFixed(2)} ₺</span>
        </div>
      `
            : ""
        }
      <div class="totals-row total">
        <span>GENEL TOPLAM:</span>
        <span>${order.total.toFixed(2)} ₺</span>
      </div>
    </div>
    
    <!-- Notes -->
    ${order.customerNote
            ? `
      <div class="notes">
        <strong>Müşteri Notu:</strong>
        <p>${order.customerNote}</p>
      </div>
    `
            : ""
        }
    
    <!-- Footer -->
    <div class="footer">
      <p>Bu fatura elektronik ortamda oluşturulmuştur.</p>
      <p>Alışverişiniz için teşekkür ederiz!</p>
      ${company.email ? `<p>Sorularınız için: ${company.email}</p>` : ""}
    </div>
  </div>
</body>
</html>
  `;
}
