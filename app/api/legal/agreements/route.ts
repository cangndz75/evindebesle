// app/api/legal/agreements/route.ts
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
  return (s ?? "").toString().trim() || "—";
}

/** Sipariş tablosu (ürün/hizmet + kargo + indirimler) */
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
          <th align="left">Ürün/Hizmet Açıklaması</th>
          <th align="right">Adet</th>
          <th align="right">Peşin Fiyatı</th>
          <th align="right">Ara Toplam (KDV Dahil)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td>Kargo Tutarı</td>
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

/** Ön Bilgilendirme Formu (hizmet odaklı) */
function preInfoTemplate(data: any) {
  const {
    buyer, seller, platform,
    orderTableHtml,
    paymentMethod, deliveryAddress, invoiceAddress, recipientName,
    orderDate, deliveryType, deliveryDeadlineLabel, deliveryDeadline,
    cargoHandOverLabel, cargoHandOverDate,
  } = data;

  // Varsayılan satıcı (web sitenizdeki “İletişim Bilgileri” bölümü)
  const sellerDefaults = {
    title: "Dogo Petshop LTD. ŞTİ.",
    tax: "Yakacık VD | VKN: 3021119045 • MERSİS: 0302111904500001",
    address: "Uptwins Blok, Orta, Yalnız Selvi Cd. No: 5AB, 34880 Kartal/İstanbul",
    phone: "+90 216 519 26 00",
    email: "info@evindebesle.com",
    website: "evindebesle.com",
  };

  const s = { ...sellerDefaults, ...(seller || {}) };

  return `
  <h3 style="text-align:center;margin:0 0 12px 0;"><b>Ön Bilgilendirme Formu</b></h3>

  <p><b>1. Taraflar ve Konu</b><br/>
  İşbu Ön Bilgilendirme Formu’nun konusu, Hizmeti Alan (Alıcı) ile Hizmeti Sunan (Satıcı) arasındaki mesafeli hizmet sözleşmesine ilişkin Kanun ve Yönetmelik uyarınca gerekli bilgilendirmedir.</p>

  <p><b>2. Hizmeti Alan, Hizmeti Sunan ve Platform</b></p>
  <p><u>HİZMETİ ALAN (ALICI)</u><br/>
  Ad/Soyad: ${safe(recipientName || buyer?.name)}<br/>
  Teslim/İfa Adresi: ${safe(deliveryAddress)}<br/>
  E‑posta: ${safe(buyer?.email)}</p>

  <p><u>HİZMETİ SUNAN (SATICI)</u><br/>
  Ünvan: ${safe(s.title)}<br/>
  Adres: ${safe(s.address)}<br/>
  Vergi/MERSİS: ${safe(s.tax)}<br/>
  Telefon: ${safe(s.phone)} — E‑posta: ${safe(s.email)}</p>

  <p><u>PLATFORM</u><br/>
  ${safe(platform?.title || "Evindebesle")} — ${safe(platform?.address || "evindebesle.com")}</p>

  <p><b>3. Ürün/Hizmet Bilgileri</b></p>
  ${orderTableHtml}

  <p><b>4. Ödeme / Adres / Zaman</b><br/>
  Ödeme Şekli ve Planı: ${safe(paymentMethod || "Online Ödeme")}<br/>
  Fatura Adresi: ${safe(invoiceAddress || deliveryAddress)}<br/>
  Sipariş Tarihi: ${safe(orderDate)}<br/>
  İfa/İcra Şekli: ${safe(deliveryType || "Adrese İfa")}<br/>
  ${safe(deliveryDeadlineLabel || "Hizmet Dönemi")}: ${safe(deliveryDeadline)}<br/>
  ${safe(cargoHandOverLabel || "Planlanan Zaman Aralığı")}: ${safe(cargoHandOverDate)}</p>

  <p><b>5. Genel Hükümler (Özet)</b><br/>
  Hizmet, siparişte belirtilen niteliklere uygun olarak ifa edilir; hizmete özel istisnalar hariç, mevzuattaki cayma ve ayıplı ifa hükümleri saklıdır.</p>
  `;
}

/** Mesafeli Satış (Hizmet) Sözleşmesi – özetli ama tam başlıklı şablon */
function distanceSalesTemplate(data: any) {
  const {
    buyer, seller,
    orderTableHtml,
    paymentMethod, deliveryAddress, invoiceAddress, recipientName,
    orderDate, deliveryType, deliveryDeadlineLabel, deliveryDeadline,
    cargoHandOverLabel, cargoHandOverDate,
  } = data;

  const sellerDefaults = {
    title: "Dogo Petshop LTD. ŞTİ.",
    tax: "Yakacık VD | VKN: 3021119045 • MERSİS: 0302111904500001",
    address: "Uptwins Blok, Orta, Yalnız Selvi Cd. No: 5AB, 34880 Kartal/İstanbul",
    phone: "+90 216 519 26 00",
    email: "info@evindebesle.com",
  };
  const s = { ...sellerDefaults, ...(seller || {}) };

  return `
  <h3 style="text-align:center;margin:0 0 12px 0;"><b>Mesafeli Satış Sözleşmesi</b></h3>

  <p><b>1. Taraflar</b><br/>
  Hizmeti Alan (Alıcı): ${safe(recipientName || buyer?.name)} — ${safe(buyer?.email)}<br/>
  Hizmeti Sunan (Satıcı): ${safe(s.title)} — ${safe(s.address)}</p>

  <p><b>2. Tanımlar</b><br/>
  Alıcı: Hizmeti ticari/mesleki olmayan amaçlarla edinen gerçek kişi. Satıcı: Hizmeti sunan tüzel/gerçek kişi. Yönetmelik: Mesafeli Sözleşmeler Yönetmeliği vb.</p>

  <p><b>3. Sözleşmenin Konusu ve Kapsamı</b><br/>
  Alıcı’nın elektronik ortamda sipariş verdiği hizmetin ifasına ilişkin tarafların hak ve yükümlülükleri belirlenir.</p>

  <p><b>4. Ön Bilgilendirme Hususları</b><br/>
  Alıcı, sipariş öncesi ve sırasında hizmet nitelikleri, fiyat, ödeme/ifa süreçleri, cayma ve istisnalar hakkında bilgilendirildiğini kabul eder.</p>

  <p><b>5. Hizmet Bilgileri</b></p>
  ${orderTableHtml}
  <p>Ödeme: ${safe(paymentMethod || "Online Ödeme")} • Sipariş Tarihi: ${safe(orderDate)}<br/>
  İfa Şekli: ${safe(deliveryType || "Adrese İfa")} • ${safe(deliveryDeadlineLabel || "Hizmet Dönemi")}: ${safe(deliveryDeadline)} • ${safe(cargoHandOverLabel || "Planlanan Zaman Aralığı")}: ${safe(cargoHandOverDate)}<br/>
  Fatura Adresi: ${safe(invoiceAddress || deliveryAddress)}</p>

  <p><b>6. Genel Hükümler</b><br/>
  Satıcı, hizmeti eksiksiz ve niteliklere uygun ifa eder. Mücbir sebep/ifa imkansızlığı halinde Alıcı bilgilendirilir ve bedeller iade sürecine alınır. İfa öncesi güvenlik/doğrulama talep edilebilir.</p>

  <p><b>7. Cayma Hakkı</b><br/>
  Alıcı, hizmete ilişkin mevzuattaki süre ve şartlarda cayma hakkını kullanabilir; istisnalar ve iade süreçleri Ön Bilgilendirme’de ayrıca yer alır.</p>

  <p><b>8. Uyuşmazlıkların Çözümü</b><br/>
  Alıcı’nın yerleşim yerindeki Tüketici Hakem Heyetleri/Tüketici Mahkemeleri yetkilidir.</p>

  <p><small>Bu metin elektronik ortamda onaylanmak suretiyle kurulmuştur.</small></p>
  `;
}

export async function POST(req: Request) {
  const body = await req.json();

  // body: items, shippingFee, discounts, paymentMethod, deliveryAddress, invoiceAddress,
  // recipientName, orderDate, deliveryType, deliveryDeadlineLabel, deliveryDeadline,
  // cargoHandOverLabel, cargoHandOverDate, buyer, seller, platform

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
