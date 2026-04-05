import { NextResponse } from "next/server";

type LineItem = { description: string; quantity: number; unitPrice: number; subtotal?: number };
type Discount = { label: string; amount: number };

function TL(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n || 0);
}

function safe(s?: string) {
  return (s ?? "").toString().trim() || "â€”";
}

function buildOrderTable(items: LineItem[], shippingFee = 0, discounts: Discount[] = []) {
  const rows = (items || []).map((it) => {
    const sub = typeof it.subtotal === "number" ? it.subtotal : (it.quantity || 0) * (it.unitPrice || 0);
    return `
      <tr>
        <td>${safe(it.description)}</td>
        <td style="text-align:right">${safe(String(it.quantity ?? 0))}</td>
        <td style="text-align:right">${TL(it.unitPrice || 0)}</td>
        <td style="text-align:right">${TL(sub)}</td>
      </tr>
    `;
  }).join("");

  const productsSubtotal = (items || []).reduce(
    (a, it) => a + (typeof it.subtotal === "number" ? it.subtotal : (it.quantity || 0) * (it.unitPrice || 0)),
    0
  );

  const discountRows = (discounts || []).map((d) => `
    <tr>
      <td>${safe(d.label)}</td>
      <td style="text-align:right">-</td>
      <td style="text-align:right">${TL(d.amount || 0)}</td>
      <td style="text-align:right">${TL(d.amount || 0)}</td>
    </tr>
  `).join("");

  const totalDiscount = (discounts || []).reduce((a, d) => a + Math.max(0, d.amount || 0), 0);
  const grandTotal = productsSubtotal + (shippingFee || 0) - totalDiscount;

  return `
    <table style="width:100%;border-collapse:collapse" border="1" cellspacing="0" cellpadding="6">
      <thead>
        <tr>
          <th align="left">ÃœrÃ¼n/Hizmet AÃ§Ä±klamasÄ±</th>
          <th align="right">Adet</th>
          <th align="right">PeÅŸin FiyatÄ±</th>
          <th align="right">Ara Toplam (KDV Dahil)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td>Kargo TutarÄ±</td>
          <td align="right">-</td>
          <td align="right">${TL(shippingFee || 0)}</td>
          <td align="right">${TL(shippingFee || 0)}</td>
        </tr>
        ${discountRows}
        <tr>
          <td><b>Toplam</b></td>
          <td></td><td></td>
          <td align="right"><b>${TL(grandTotal)}</b></td>
        </tr>
      </tbody>
    </table>
  `;
}

function preInfoTemplate(data: any) {
  const {
    buyer, seller, platform,
    orderTableHtml,
    paymentMethod, deliveryAddress, invoiceAddress, recipientName,
    orderDate, deliveryType, deliveryDeadlineLabel, deliveryDeadline,
    cargoHandOverLabel, cargoHandOverDate,
  } = data;

  const sellerDefaults = {
    title: "Dogo Petshop LTD. ÅTÄ°.",
    tax: "YakacÄ±k VD | VKN: 3021119045 â€¢ MERSÄ°S: 0302111904500001",
    address: "Uptwins Blok, Orta, YalnÄ±z Selvi Cd. No: 5AB, 34880 Kartal/Ä°stanbul",
    phone: "+90 216 519 26 00",
    email: "info@dark-velvet.com",
    website: "evindebesle.com",
  };

  const s = { ...sellerDefaults, ...(seller || {}) };

  return `
  <h3 style="text-align:center;margin:0 0 12px 0;"><b>Ã–n Bilgilendirme Formu</b></h3>

  <p><b>1. Taraflar ve Konu</b><br/>
  Ä°ÅŸbu Ã–n Bilgilendirme Formuâ€™nun konusu, Hizmeti Alan (AlÄ±cÄ±) ile Hizmeti Sunan (SatÄ±cÄ±) arasÄ±ndaki mesafeli hizmet sÃ¶zleÅŸmesine iliÅŸkin Kanun ve YÃ¶netmelik uyarÄ±nca gerekli bilgilendirmedir.</p>

  <p><b>2. Hizmeti Alan, Hizmeti Sunan ve Platform</b></p>
  <p><u>HÄ°ZMETÄ° ALAN (ALICI)</u><br/>
  Ad/Soyad: ${safe(recipientName || buyer?.name)}<br/>
  Teslim/Ä°fa Adresi: ${safe(deliveryAddress)}<br/>
  Eâ€‘posta: ${safe(buyer?.email)}</p>

  <p><u>HÄ°ZMETÄ° SUNAN (SATICI)</u><br/>
  Ãœnvan: ${safe(s.title)}<br/>
  Adres: ${safe(s.address)}<br/>
  Vergi/MERSÄ°S: ${safe(s.tax)}<br/>
  Telefon: ${safe(s.phone)} â€” Eâ€‘posta: ${safe(s.email)}</p>

  <p><u>PLATFORM</u><br/>
  ${safe(platform?.title || "Evindebesle")} â€” ${safe(platform?.address || "evindebesle.com")}</p>

  <p><b>3. ÃœrÃ¼n/Hizmet Bilgileri</b></p>
  ${orderTableHtml}

  <p><b>4. Ã–deme / Adres / Zaman</b><br/>
  Ã–deme Åekli ve PlanÄ±: ${safe(paymentMethod || "Online Ã–deme")}<br/>
  Fatura Adresi: ${safe(invoiceAddress || deliveryAddress)}<br/>
  SipariÅŸ Tarihi: ${safe(orderDate)}<br/>
  Ä°fa/Ä°cra Åekli: ${safe(deliveryType || "Adrese Ä°fa")}<br/>
  ${safe(deliveryDeadlineLabel || "Hizmet DÃ¶nemi")}: ${safe(deliveryDeadline)}<br/>
  ${safe(cargoHandOverLabel || "Planlanan Zaman AralÄ±ÄŸÄ±")}: ${safe(cargoHandOverDate)}</p>

  <p><b>5. Genel HÃ¼kÃ¼mler (Ã–zet)</b><br/>
  Hizmet, sipariÅŸte belirtilen niteliklere uygun olarak ifa edilir; hizmete Ã¶zel istisnalar hariÃ§, mevzuattaki cayma ve ayÄ±plÄ± ifa hÃ¼kÃ¼mleri saklÄ±dÄ±r.</p>
  `;
}

function distanceSalesTemplate(data: any) {
  const {
    buyer, seller,
    orderTableHtml,
    paymentMethod, deliveryAddress, invoiceAddress, recipientName,
    orderDate, deliveryType, deliveryDeadlineLabel, deliveryDeadline,
    cargoHandOverLabel, cargoHandOverDate,
  } = data;

  const sellerDefaults = {
    title: "Dogo Petshop LTD. ÅTÄ°.",
    tax: "YakacÄ±k VD | VKN: 3021119045 â€¢ MERSÄ°S: 0302111904500001",
    address: "Uptwins Blok, Orta, YalnÄ±z Selvi Cd. No: 5AB, 34880 Kartal/Ä°stanbul",
    phone: "+90 216 519 26 00",
    email: "info@dark-velvet.com",
  };
  const s = { ...sellerDefaults, ...(seller || {}) };

  return `
  <h3 style="text-align:center;margin:0 0 12px 0;"><b>Mesafeli SatÄ±ÅŸ SÃ¶zleÅŸmesi</b></h3>

  <p><b>1. Taraflar</b><br/>
  Hizmeti Alan (AlÄ±cÄ±): ${safe(recipientName || buyer?.name)} â€” ${safe(buyer?.email)}<br/>
  Hizmeti Sunan (SatÄ±cÄ±): ${safe(s.title)} â€” ${safe(s.address)}</p>

  <p><b>2. TanÄ±mlar</b><br/>
  AlÄ±cÄ±: Hizmeti ticari/mesleki olmayan amaÃ§larla edinen gerÃ§ek kiÅŸi. SatÄ±cÄ±: Hizmeti sunan tÃ¼zel/gerÃ§ek kiÅŸi. YÃ¶netmelik: Mesafeli SÃ¶zleÅŸmeler YÃ¶netmeliÄŸi vb.</p>

  <p><b>3. SÃ¶zleÅŸmenin Konusu ve KapsamÄ±</b><br/>
  AlÄ±cÄ±â€™nÄ±n elektronik ortamda sipariÅŸ verdiÄŸi hizmetin ifasÄ±na iliÅŸkin taraflarÄ±n hak ve yÃ¼kÃ¼mlÃ¼lÃ¼kleri belirlenir.</p>

  <p><b>4. Ã–n Bilgilendirme HususlarÄ±</b><br/>
  AlÄ±cÄ±, sipariÅŸ Ã¶ncesi ve sÄ±rasÄ±nda hizmet nitelikleri, fiyat, Ã¶deme/ifa sÃ¼reÃ§leri, cayma ve istisnalar hakkÄ±nda bilgilendirildiÄŸini kabul eder.</p>

  <p><b>5. Hizmet Bilgileri</b></p>
  ${orderTableHtml}
  <p>Ã–deme: ${safe(paymentMethod || "Online Ã–deme")} â€¢ SipariÅŸ Tarihi: ${safe(orderDate)}<br/>
  Ä°fa Åekli: ${safe(deliveryType || "Adrese Ä°fa")} â€¢ ${safe(deliveryDeadlineLabel || "Hizmet DÃ¶nemi")}: ${safe(deliveryDeadline)} â€¢ ${safe(cargoHandOverLabel || "Planlanan Zaman AralÄ±ÄŸÄ±")}: ${safe(cargoHandOverDate)}<br/>
  Fatura Adresi: ${safe(invoiceAddress || deliveryAddress)}</p>

  <p><b>6. Genel HÃ¼kÃ¼mler</b><br/>
  SatÄ±cÄ±, hizmeti eksiksiz ve niteliklere uygun ifa eder. MÃ¼cbir sebep/ifa imkansÄ±zlÄ±ÄŸÄ± halinde AlÄ±cÄ± bilgilendirilir ve bedeller iade sÃ¼recine alÄ±nÄ±r. Ä°fa Ã¶ncesi gÃ¼venlik/doÄŸrulama talep edilebilir.</p>

  <p><b>7. Cayma HakkÄ±</b><br/>
  AlÄ±cÄ±, hizmete iliÅŸkin mevzuattaki sÃ¼re ve ÅŸartlarda cayma hakkÄ±nÄ± kullanabilir; istisnalar ve iade sÃ¼reÃ§leri Ã–n Bilgilendirmeâ€™de ayrÄ±ca yer alÄ±r.</p>

  <p><b>8. UyuÅŸmazlÄ±klarÄ±n Ã‡Ã¶zÃ¼mÃ¼</b><br/>
  AlÄ±cÄ±â€™nÄ±n yerleÅŸim yerindeki TÃ¼ketici Hakem Heyetleri/TÃ¼ketici Mahkemeleri yetkilidir.</p>

  <p><small>Bu metin elektronik ortamda onaylanmak suretiyle kurulmuÅŸtur.</small></p>
  `;
}

export async function POST(req: Request) {
  const body = await req.json();


  const orderTableHtml = buildOrderTable(
    (body.items || []) as LineItem[],
    body.shippingFee || 0,
    (body.discounts || []) as Discount[]
  );

  const payload = { ...body, orderTableHtml };

  const preInfoHTML = preInfoTemplate(payload);
  const distanceSalesHTML = distanceSalesTemplate(payload);

  return NextResponse.json({ preInfoHTML, distanceSalesHTML });
}
