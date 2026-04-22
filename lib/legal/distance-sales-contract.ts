import "server-only";

import { prisma } from "@/lib/db";
import { DISTANCE_SALES_SELLER_DEFAULT } from "@/lib/legal/distance-sales-seller-constants";

function escapeHtml(text: string) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function buildDistanceSalesContractHtmlForOrder(orderId: string): Promise<string | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: true,
      shippingAddress: { include: { district: true } },
      billingAddress: { include: { district: true } },
      cargoCompany: { select: { name: true } },
    },
  });

  if (!order) return null;

  const settings = await prisma.companySettings.findFirst();
  const seller = {
    legalTitle: settings?.companyName || DISTANCE_SALES_SELLER_DEFAULT.legalTitle,
    address: settings?.companyAddress || DISTANCE_SALES_SELLER_DEFAULT.address,
    phone: settings?.phone || DISTANCE_SALES_SELLER_DEFAULT.phone,
    email: settings?.email || DISTANCE_SALES_SELLER_DEFAULT.email,
    website: settings?.website || DISTANCE_SALES_SELLER_DEFAULT.website,
    mersis: DISTANCE_SALES_SELLER_DEFAULT.mersis,
    taxOffice: settings?.taxOffice || DISTANCE_SALES_SELLER_DEFAULT.taxOffice,
    taxNumber: settings?.taxNumber || DISTANCE_SALES_SELLER_DEFAULT.taxNumber,
  };

  const ship = order.shippingAddress || order.billingAddress;
  const district = ship?.district;
  const addrLine = ship?.fullAddress || "";
  const cityLine = [district?.name, district?.city].filter(Boolean).join(" / ");
  const buyerAddress = [addrLine, cityLine].filter(Boolean).join(" — ");

  const buyerName =
    ship?.fullName ||
    order.user?.name ||
    [order.billingAddress?.fullName].filter(Boolean)[0] ||
    "Alıcı";
  const buyerPhone =
    ship?.phone || order.user?.phone || order.billingAddress?.phone || "—";
  const buyerEmail =
    order.email || order.user?.email || ship?.email || order.billingAddress?.email || "—";

  const paymentLabel =
    order.paymentMethod === "TEST"
      ? "Test ödemesi"
      : "Kredi / Banka Kartı (iyzico güvenli ödeme)";

  const cargoName = order.cargoCompany?.name || "Anlaşmalı kargo şirketimiz";
  const orderedAt = order.createdAt.toLocaleString("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const rows = order.items
    .map(
      (it: { productName: string; quantity: number; unitPrice: number; totalPrice: number }) =>
        `<tr>
          <td style="padding:6px;border:1px solid #ddd">${escapeHtml(it.productName)}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${it.quantity}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right">${it.unitPrice.toFixed(2)} TL</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right">${it.totalPrice.toFixed(2)} TL</td>
        </tr>`
    )
    .join("");

  return `<div style="font-family:Arial,sans-serif;line-height:1.55;color:#111;font-size:14px;max-width:720px">
  <h1 style="font-size:18px">Mesafeli Satış Sözleşmesi</h1>
  <p><strong>Sipariş no:</strong> ${escapeHtml(order.orderNumber)}</p>
  <p><strong>Sipariş tarihi:</strong> ${escapeHtml(orderedAt)}</p>

  <h2 style="font-size:16px;margin-top:1.25em">MADDE 1 - TARAFLAR</h2>
  <p><strong>1.1. SATICI BİLGİLERİ</strong></p>
  <p>
    <strong>Unvanı:</strong> ${escapeHtml(seller.legalTitle)}<br/>
    <strong>Adresi:</strong> ${escapeHtml(seller.address)}<br/>
    <strong>Telefon:</strong> ${escapeHtml(seller.phone)}<br/>
    <strong>E-posta:</strong> ${escapeHtml(seller.email)}<br/>
    <strong>İnternet Sitesi:</strong> <a href="${escapeHtml(seller.website)}">${escapeHtml(seller.website)}</a><br/>
    <strong>MERSİS No:</strong> ${escapeHtml(seller.mersis)}<br/>
    <strong>Vergi Dairesi ve No:</strong> ${escapeHtml(seller.taxOffice)} — ${escapeHtml(seller.taxNumber)}
  </p>
  <p><strong>1.2. ALICI (TÜKETİCİ) BİLGİLERİ</strong></p>
  <p>
    <strong>Adı/Soyadı/Unvanı:</strong> ${escapeHtml(buyerName)}<br/>
    <strong>Teslimat Adresi:</strong> ${escapeHtml(buyerAddress || "—")}<br/>
    <strong>Telefon:</strong> ${escapeHtml(buyerPhone)}<br/>
    <strong>E-posta:</strong> ${escapeHtml(buyerEmail)}
  </p>

  <h2 style="font-size:16px;margin-top:1.25em">MADDE 2 - KONU</h2>
  <p>İşbu Sözleşme'nin konusu, ALICI'nın SATICI'ya ait dark-velvet.com internet sitesinden elektronik ortamda siparişini yaptığı, aşağıda nitelikleri ve satış fiyatı belirtilen ürünün/ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve 29188 sayılı Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.</p>

  <h2 style="font-size:16px;margin-top:1.25em">MADDE 3 - SÖZLEŞME KONUSU ÜRÜN BİLGİLERİ VE ÖDEME</h2>
  <p><strong>3.1.</strong> Ürünlerin cinsi ve türü, miktarı, marka/modeli, rengi ve tüm vergiler dâhil satış bedeli aşağıdaki gibidir:</p>
  <table style="border-collapse:collapse;width:100%;margin:10px 0">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:6px;border:1px solid #ddd;text-align:left">Ürün</th>
        <th style="padding:6px;border:1px solid #ddd">Adet</th>
        <th style="padding:6px;border:1px solid #ddd;text-align:right">Birim fiyat</th>
        <th style="padding:6px;border:1px solid #ddd;text-align:right">Satır tutarı</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p><strong>Ara Toplam:</strong> ${order.subtotal.toFixed(2)} TL</p>
  <p><strong>Kargo Ücreti:</strong> ${order.shippingCost.toFixed(2)} TL</p>
  <p><strong>Toplam Tutar (Vergiler Dâhil):</strong> ${order.total.toFixed(2)} TL</p>
  <p><strong>3.2. Ödeme Şekli ve Planı:</strong> ${escapeHtml(paymentLabel)}</p>
  <p><strong>3.3. Teslimat Şartları:</strong> Ürün/ürünler, ALICI'nın yukarıda belirtilen teslimat adresine, SATICI'nın anlaşmalı olduğu kargo firması <strong>${escapeHtml(cargoName)}</strong> aracılığıyla teslim edilecektir.</p>

  <h2 style="font-size:16px;margin-top:1.25em">MADDE 4 - SATICININ BEYAN VE TAAHHÜTLERİ</h2>
  <p>4.1. SATICI, sözleşme konusu ürünün sağlam, eksiksiz, siparişte belirtilen niteliklere uygun ve varsa garanti belgeleri ve kullanım kılavuzları ile teslim edilmesinden sorumludur.</p>
  <p>4.2. SATICI, haklı bir nedenle sözleşme konusu ürünün tedarik edilemeyeceğinin anlaşılması hâlinde, bu durumu öğrendiği tarihten itibaren 3 (üç) gün içinde ALICI'yı bilgilendirmek ve 14 (on dört) gün içinde tahsil edilen tüm ödemeleri iade etmek kaydıyla sözleşmeyi feshedebilir. Ürünün stokta bulunmaması imkânsızlaşma olarak kabul edilmez.</p>
  <p>4.3. SATICI, malın ALICI'ya veya ALICI'nın gösterdiği üçüncü kişiye teslimine kadar oluşan kayıp ve hasarlardan sorumludur.</p>

  <h2 style="font-size:16px;margin-top:1.25em">MADDE 5 - ALICININ BEYAN VE TAAHHÜTLERİ</h2>
  <p>5.1. ALICI, dark-velvet.com internet sitesinde sözleşme konusu ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini beyan eder.</p>
  <p>5.2. ALICI, ürünü kargodan teslim almadan önce muayene edecek; ezik, kırık, ambalajı yırtılmış vb. hasarlı ve ayıplı mal/hizmeti kargo şirketinden teslim almayacak ve tutanak tutturacaktır. Teslim alınan ürünün hasarsız ve sağlam olduğu kabul edilecektir.</p>

  <h2 style="font-size:16px;margin-top:1.25em">MADDE 6 - TESLİMAT SÜRESİ</h2>
  <p>6.1. Satın alınan ürün/ürünler, taahhüt edilen sürede teslim edilir. Bu süre her halükarda siparişin SATICI'ya ulaşmasından itibaren yasal sınır olan 30 (otuz) günü geçemez.</p>
  <p>6.2. Ürün, ALICI'dan başka bir kişi/kuruluşa teslim edilecek ise, teslim edilecek kişi/kuruluşun teslimatı kabul etmemesinden SATICI sorumlu tutulamaz.</p>

  <h2 style="font-size:16px;margin-top:1.25em">MADDE 7 - CAYMA HAKKI</h2>
  <p>7.1. ALICI, mal satışına ilişkin mesafeli sözleşmelerde, ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa teslim tarihinden itibaren 14 (on dört) gün içerisinde hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden cayma hakkına sahiptir.</p>
  <p>7.2. Cayma hakkının kullanılması için bu süre içerisinde SATICI'nın yukarıda belirtilen iletişim adreslerine (e-posta veya telefon ile) açık bir şekilde bildirimde bulunulması şarttır.</p>
  <p>7.3. Cayma hakkının kullanılması hâlinde: ALICI, cayma bildirimini SATICI'ya yönelttiği tarihten itibaren 10 (on) gün içinde ürünü SATICI'ya iade etmek zorundadır. İade edilecek ürünlerin kutusu, ambalajı, varsa standart aksesuarları ile birlikte eksiksiz ve hasarsız olarak teslim edilmesi gerekmektedir.</p>
  <p>7.4. SATICI, cayma bildiriminin kendisine ulaşmasından itibaren 14 (on dört) gün içinde ALICI'nın yaptığı tüm ödemeleri (varsa teslimat masrafları dâhil) ALICI'nın satın alırken kullandığı ödeme aracına uygun şekilde tek seferde iade edecektir.</p>
  <p>7.5. İade işleminde kargo bedeli, SATICI'nın ön bilgilendirme formunda belirttiği anlaşmalı kargo şirketi <strong>${escapeHtml(cargoName)}</strong> ile gönderilmesi şartıyla SATICI'ya aittir.</p>

  <h2 style="font-size:16px;margin-top:1.25em">MADDE 8 - CAYMA HAKKININ KULLANILAMAYACAĞI HALLER</h2>
  <p>Aşağıdaki ürün gruplarında yasa gereği cayma hakkı kullanılamaz:</p>
  <p>İç Giyim ve Hijyenik Ürünler: Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olması kaydıyla; iç çamaşırı, mayo, bikini, küpe vb. iadesi sağlık ve hijyen açısından uygun olmayan ürünler. (Dark Velvet üzerinden satın alınan iç giyim ve aksesuar ürünlerinde, ürünün hijyen bandının veya koruyucu ambalajının açılmış, denenmiş veya kullanılmış olması hâlinde cayma hakkı geçerli değildir.)</p>
  <p>Tüketicinin özel istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan, özelleştirilmiş mallar.</p>
  <p>Çabuk bozulabilen veya son kullanma tarihi geçebilecek mallar.</p>

  <h2 style="font-size:16px;margin-top:1.25em">MADDE 9 - UYUŞMAZLIKLARIN ÇÖZÜMÜ</h2>
  <p>İşbu sözleşmenin uygulanmasında ve çıkabilecek uyuşmazlıklarda, Ticaret Bakanlığı tarafından her yıl aralık ayında belirlenen parasal sınırlar dâhilinde ALICI'nın veya SATICI'nın yerleşim yerindeki Tüketici Hakem Heyetleri, bu sınırları aşan durumlarda ise Tüketici Mahkemeleri yetkilidir.</p>

  <h2 style="font-size:16px;margin-top:1.25em">MADDE 10 - YÜRÜRLÜK</h2>
  <p>ALICI, Site üzerinden verdiği siparişe ait ödemeyi gerçekleştirdiğinde işbu sözleşmenin tüm şartlarını kabul etmiş sayılır. SATICI, siparişin gerçekleşmesi öncesinde işbu sözleşmenin sitede ALICI tarafından okunup kabul edildiğine dair gerekli yazılımsal düzenlemeleri yapmakla yükümlüdür.</p>

  <p style="margin-top:1.5em"><strong>SATICI:</strong> Dark Velvet (${escapeHtml(seller.legalTitle)})<br/>
  <strong>ALICI:</strong> ${escapeHtml(buyerName)}<br/>
  <strong>TARİH:</strong> ${escapeHtml(orderedAt)}</p>
</div>`;
}
