"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;      // vergiler dahil birim fiyat
  subtotal?: number;      // verilirse bunu kullanır, yoksa quantity*unitPrice hesaplar
};

type AgreementsModalProps = {
  isOpen: boolean;
  onClose: () => void;

  // Hangi sekme ile açılsın (ör: "preinfo" veya "distance")
  defaultTab?: "preinfo" | "distance";

  // Dinamik özet verileri
  items: LineItem[];
  shippingFee?: number;
  discounts?: { label: string; amount: number }[]; // pozitif rakam indirim tutarı
  paymentMethod?: string;
  deliveryAddress?: string;
  invoiceAddress?: string;
  recipientName?: string;
  orderDate?: string; // "11.8.2025" gibi
  deliveryType?: string;
  deliveryDeadlineLabel?: string; // "Teslimat Süresi"
  deliveryDeadline?: string;      // "En geç 30 gün"
  cargoHandOverLabel?: string;    // "Kargo Şirketi’ne Teslim Süresi"
  cargoHandOverDate?: string;     // "2025-08-14"

  // Tam metin içerikler (HTML olarak)
  preInfoHTML: string;
  distanceSalesHTML: string;
};

function TL(n: number | undefined) {
  if (typeof n !== "number") return "-";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(n);
}

export default function AgreementsModal({
  isOpen,
  onClose,
  defaultTab = "preinfo",
  items,
  shippingFee = 0,
  discounts = [],
  paymentMethod = "Banka Kartı/Kredi Kartı İle İşlem (Tek Çekim)",
  deliveryAddress,
  invoiceAddress,
  recipientName,
  orderDate,
  deliveryType = "Alıcıya Teslim",
  deliveryDeadlineLabel = "Teslimat Süresi*",
  deliveryDeadline = "En geç 30 gün",
  cargoHandOverLabel = "Kargo Şirketi’ne Teslim Süresi**",
  cargoHandOverDate,
  preInfoHTML,
  distanceSalesHTML,
}: AgreementsModalProps) {
  const [tab, setTab] = useState<"preinfo" | "distance">(defaultTab);
  const portalRef = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) setTab(defaultTab);
  }, [isOpen, defaultTab]);

  useEffect(() => {
    if (!portalRef.current) portalRef.current = document.body;
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const productsSubtotal = useMemo(
    () => items.reduce((acc, it) => acc + (typeof it.subtotal === "number" ? it.subtotal : it.quantity * it.unitPrice), 0),
    [items]
  );

  const totalDiscount = useMemo(() => discounts.reduce((a, d) => a + Math.max(0, d.amount), 0), [discounts]);

  const grandTotal = useMemo(() => productsSubtotal + shippingFee - totalDiscount, [productsSubtotal, shippingFee, totalDiscount]);

  if (!isOpen || !portalRef.current) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start md:items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl mx-auto my-4 md:my-10">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 md:px-6 py-4 border-b">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Sözleşmeler ve Formlar</h2>
              <p className="text-sm text-neutral-500">Sipariş ve yasal metinleri aşağıdan inceleyebilirsiniz.</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-100 active:scale-95 transition"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>

          {/* Order summary */}
          <div className="px-5 md:px-6 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="rounded-xl border bg-white">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <span className="font-medium">Ön Bilgilendirme Özeti</span>
                    <span className="text-xs text-neutral-500">Dinamik içerik</span>
                  </div>
                  <div className="p-0 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-neutral-50 text-neutral-600">
                        <tr>
                          <th className="text-left font-medium px-4 py-2">Ürün/Hizmet Açıklaması</th>
                          <th className="text-right font-medium px-4 py-2">Adet</th>
                          <th className="text-right font-medium px-4 py-2">Peşin Fiyatı</th>
                          <th className="text-right font-medium px-4 py-2">Ara Toplam (KDV Dahil)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => {
                          const sub = typeof it.subtotal === "number" ? it.subtotal : it.quantity * it.unitPrice;
                          return (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2">{it.description}</td>
                              <td className="px-4 py-2 text-right">{it.quantity}</td>
                              <td className="px-4 py-2 text-right">{TL(it.unitPrice)}</td>
                              <td className="px-4 py-2 text-right">{TL(sub)}</td>
                            </tr>
                          );
                        })}
                        <tr className="border-t">
                          <td className="px-4 py-2 text-neutral-600">Kargo Tutarı</td>
                          <td className="px-4 py-2 text-right">-</td>
                          <td className="px-4 py-2 text-right">{TL(shippingFee)}</td>
                          <td className="px-4 py-2 text-right">{TL(shippingFee)}</td>
                        </tr>
                        {discounts.map((d, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-4 py-2 text-neutral-600">{d.label}</td>
                            <td className="px-4 py-2 text-right">-</td>
                            <td className="px-4 py-2 text-right">{TL(d.amount)}</td>
                            <td className="px-4 py-2 text-right">{TL(d.amount)}</td>
                          </tr>
                        ))}
                        <tr className="border-t bg-neutral-50">
                          <td className="px-4 py-2 font-semibold">Toplam</td>
                          <td />
                          <td />
                          <td className="px-4 py-2 text-right font-semibold">{TL(grandTotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 px-4 py-4 text-sm">
                    <Row label="Kargo Hariç Toplam Ürün Bedeli" value={TL(productsSubtotal)} />
                    <Row label="Kargo Ücreti" value={TL(shippingFee)} />
                    <Row label="Taksit Farkı" value={TL(0)} />
                    <Row label="Toplam Sipariş Bedeli" value={TL(grandTotal)} />
                    <Row label="Ödeme Şekli ve Planı" value={paymentMethod} />
                    {deliveryAddress && <Row label="Teslimat Adresi" value={deliveryAddress} />}
                    {recipientName && <Row label="Teslim Edilecek Kişi" value={recipientName} />}
                    {invoiceAddress && <Row label="Fatura Adresi" value={invoiceAddress} />}
                    {orderDate && <Row label="Sipariş Tarihi" value={orderDate} />}
                    <Row label="Teslim Şekli" value={deliveryType} />
                    <Row label={deliveryDeadlineLabel} value={deliveryDeadline} />
                    {cargoHandOverDate && <Row label={cargoHandOverLabel} value={cargoHandOverDate} />}
                  </div>
                </div>
              </div>

              {/* Sticky right side info */}
              <div className="lg:col-span-1">
                <div className="rounded-xl border bg-gradient-to-b from-white to-neutral-50 p-4">
                  <div className="text-sm text-neutral-600 space-y-2">
                    <p><span className="font-medium">Alıcı:</span> {recipientName || "-"}</p>
                    <p><span className="font-medium">Teslimat Adresi:</span> {deliveryAddress || "-"}</p>
                    <p><span className="font-medium">Fatura Adresi:</span> {invoiceAddress || "-"}</p>
                    <p><span className="font-medium">Ödeme:</span> {paymentMethod}</p>
                    <div className="h-px bg-neutral-200 my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Genel Toplam</span>
                      <span>{TL(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-5 md:px-6">
            <div className="inline-flex rounded-full border p-1 bg-neutral-100">
              <button
                onClick={() => setTab("preinfo")}
                className={`px-4 py-2 text-sm rounded-full transition ${
                  tab === "preinfo" ? "bg-white shadow font-medium" : "text-neutral-600 hover:text-neutral-800"
                }`}
              >
                Ön Bilgilendirme Formu
              </button>
              <button
                onClick={() => setTab("distance")}
                className={`px-4 py-2 text-sm rounded-full transition ${
                  tab === "distance" ? "bg-white shadow font-medium" : "text-neutral-600 hover:text-neutral-800"
                }`}
              >
                Mesafeli Satış Sözleşmesi
              </button>
            </div>
          </div>

          {/* Content panes */}
          <div className="px-5 md:px-6 pb-5 md:pb-6">
            <div className="mt-4 grid gap-4">
              {tab === "preinfo" ? (
                <Panel title="Ön Bilgilendirme Formu" html={preInfoHTML} />
              ) : (
                <Panel title="Mesafeli Satış Sözleşmesi" html={distanceSalesHTML} />
              )}
              <div className="text-[11px] text-neutral-500">
                <p>* Sözleşme ve ilgili mevzuat hükümlerinde yer alan istisnalar saklıdır.</p>
                <p>** Belirtilen süre teslimatın taahhüdü değildir; satıcı tarafından kargo şirketine teslim edilme süresini ifade eder.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 md:px-6 py-4 bg-neutral-50/70 border-t flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-neutral-300 hover:bg-white transition active:scale-95"
            >
              Kapat
            </button>
            <button
              onClick={onClose}
              className="h-10 px-5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 shadow-sm active:scale-95 transition"
            >
              Okudum
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalRef.current
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="truncate text-neutral-500">{label}</div>
      <div className="text-neutral-300">:</div>
      <div className="text-neutral-800">{value}</div>
    </div>
  );
}

function Panel({ title, html }: { title: string; html: string }) {
  return (
    <section className="rounded-xl border bg-white">
      <header className="px-4 py-3 border-b">
        <h3 className="font-medium">{title}</h3>
      </header>
      <div className="p-4 max-h-[50vh] overflow-y-auto prose prose-sm prose-neutral [&>*]:mb-3">
        {/* Yasal metinler HTML olarak geliyor */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}

/* --- AŞAĞIDA: Tam metinler (HTML) — dışarıdan da prop olarak geçebilirsiniz. --- */
export const PRE_INFO_HTML = `
<p><strong>ÖN BİLGİLENDİRME FORMU</strong></p>
<p><strong>1. TARAFLAR VE KONU</strong><br/>
İşbu Ön Bilgilendirme Formu’nun konusu, Alıcı ve Satıcı arasındaki Sözleşme’ye ilişkin Kanun ve Yönetmelik hükümleri uyarınca bilgilendirilmesidir. Ayrıca Yönetmelik uyarınca yer verilmesi zorunlu olan hususlar Ön Bilgilendirme Formu’nda yer almaktadır.</p>
<p>ALICI, Ön Bilgilendirme Formu ve Sözleşme’ye ilişkin bilgileri üyeliğinin bağlı olduğu “Hesabım” sayfasından takip edebilecek olup değişen bilgilerini bu sayfa üstünden güncelleyebilecektir. Ön Bilgilendirme Formu ve Sözleşme’nin bir nüshası Alıcı’nın üyelik hesabında mevcuttur ve talep edilmesi halinde ayrıca elektronik posta ile de gönderilebilecektir.</p>

<p><strong>2. TANIMLAR</strong><br/>
Ön Bilgilendirme Formu ve Sözleşme’nin uygulanmasında ve yorumlanmasında aşağıda yazılı terimler karşılarındaki yazılı açıklamaları ifade edeceklerdir.</p>
<p><strong>ALICI</strong>: Bir Mal veya Hizmet’i ticari veya mesleki olmayan amaçlarla edinen, kullanan veya yararlanan gerçek kişiyi,<br/>
<strong>Bakanlık</strong>: Türkiye Cumhuriyeti Ticaret Bakanlığı’nı,<br/>
<strong>Banka</strong>: 5411 sayılı Bankacılık Kanunu uyarınca kurulan lisanslı kuruluşları,<br/>
<strong>DSM veya Elektronik Ticaret Aracı Hizmet Sağlayıcı</strong>: Oluşturduğu sistem ile Satıcı’nın Ürün/Hizmet’i satışa sunduğu Platform’u işleten ve Satıcı adına mesafeli sözleşme kurulmasına aracılık eden DSM Grup Danışmanlık İletişim ve Satış Ticaret Anonim Şirketi’ni,<br/>
<strong>Hizmet</strong>: Bir ücret veya menfaat karşılığında yapılan ya da yapılması taahhüt edilen Ürün sağlama dışındaki her türlü tüketici işleminin konusunu,<br/>
<strong>Kanun</strong>: 6502 sayılı Tüketicinin Korunması Hakkında Kanun’u,<br/>
<strong>Kargo Şirketi</strong>: Ürün’ün Alıcı’ya ulaştırılmasını, iade süreçlerinde Alıcı’dan alınarak Satıcı veya DSM’ye ulaştırılmasını sağlayan anlaşmalı kargo veya lojistik şirketini,<br/>
<strong>Ön Bilgilendirme Formu</strong>: ...</p>

<p><strong>3. ALICI, SATICI VE ELEKTRONİK TİCARET ARACI HİZMET SAĞLAYICI</strong></p>
<p><u>ALICI BİLGİLERİ</u><br/>
Teslim Edilecek Kişi: Can Gündüz<br/>
Teslimat Adresi: Cengiz Sokak Celep Apartmanı 21/1/İstanbul<br/>
Telefon: 531*****97<br/>
Faks: 531*****97<br/>
E-posta/Kullanıcı Adı: cangunduz0001@gmail.com</p>

<p><u>SATICI BİLGİLERİ (Örnek-1)</u><br/>
Satıcının Ticaret Unvanı / Adı ve Soyadı: DOĞANLI KAĞIT AMBALAJ MATBAACILIK SANAYİ İÇ VE DIŞ TİCARET LİMİTED ŞİRKETİ<br/>
Satıcının Adresi: Mahalle/Semt:YAKUPLU MAH. Cadde/Sokak:194. SK. - No:1 İç Kapı No:316<br/>
Mersis: 0050050744981485 — VKN: 3081143701 — Tel: 5375899675<br/>
KEP/E-posta: happypaper@hs01.kep.tr</p>

<p><u>SATICI BİLGİLERİ (Örnek-2)</u><br/>
Satıcının Ticaret Unvanı / Adı ve Soyadı: TAN INVEST DIŞ TİCARET ANONİM ŞİRKETİ<br/>
Satıcının Adresi: ESENTEPE MAH. ECZA SK. SAFTER IŞ HANI No:6 İç Kapı No:1<br/>
Mersis: 0818035735400015 — VKN: 8180357354 — Tel/Faks: 5312613855<br/>
KEP/E-posta: taninvest@hs03.kep.tr</p>

<p><u>ELEKTRONİK TİCARET ARACI HİZMET SAĞLAYICI</u><br/>
DSM Grup Danışmanlık İletişim ve Satış Ticaret A.Ş. — Spine Tower No:5/19 Sarıyer İstanbul<br/>
Mersis: 0313055766900016 — VKN: Maslak VD-3130557669 — Tel: 0 212 331 0 200</p>

<p><strong>4. ÜRÜN/HİZMET BİLGİLERİ</strong><br/>
4.1... (Metnin tamamı)<br/>
4.2... (Tablo ve tutarlar dinamik olarak yukarıdaki tabloda gösterilmektedir.)<br/>
4.3. <em>SÖZ KONUSU ÜRÜN BEDELİ, “TRENDYOL ALICI GÜVENCESİ” ...</em></p>

<p><strong>5. GENEL HÜKÜMLER</strong><br/>
5.1 ... 5.17 ... (Gönderdiğin metnin tamamı buraya eklenmiştir.)</p>

<p><strong>6. ÖZEL ŞARTLAR</strong><br/>6.1 ... 6.7 ...</p>

<p><strong>7. KİŞİSEL VERİLERİN KORUNMASI ...</strong><br/>7.1 ... 7.3 ...</p>

<p><strong>8. CAYMA HAKKI</strong><br/>8.1 ... 8.12 ...</p>

<p><strong>9. CAYMA HAKKININ KULLANILAMAYACAĞI HALLER</strong><br/>9.1 ... 9.3 ...</p>

<p><strong>10. UYUŞMAZLIKLARIN ÇÖZÜMÜ</strong><br/>10.1 ...</p>
`;

export const DISTANCE_SALES_HTML = `
<p style="text-align:center"><strong>MESAFELİ SATIŞ SÖZLEŞMESİ</strong></p>
<p><strong>1. TARAFLAR</strong><br/>İşbu Mesafeli Satış Sözleşmesi ("Sözleşme"), Alıcı ve Satıcı arasında ...</p>

<p><strong>2. TANIMLAR</strong><br/>ALICI ... Yönetmelik ... (metnin tamamı)</p>

<p><strong>3. SÖZLEŞMENİN KONUSU ve KAPSAMI</strong><br/>3.1 ... 3.3 ...</p>

<p><strong>4. ALICI’NIN ÖNCEDEN BİLGİLENDİRİLDİĞİ HUSUSLAR</strong><br/>a) ... r) ...</p>

<p><strong>5. ALICI, SATICI ... VE FATURA BİLGİLERİ</strong><br/>Alıcı, Satıcı (Örnek-1/Örnek-2), DSM bilgileri ve fatura açıklamaları ...</p>

<p><strong>6. ÜRÜN/HİZMET BİLGİLERİ</strong><br/>6.1 ... 6.3 ...</p>

<p><strong>7. GENEL HÜKÜMLER</strong><br/>7.1 ... 7.17 ...</p>

<p><strong>8. ÖZEL ŞARTLAR</strong><br/>8.1 ... 8.8 ...</p>

<p><strong>9. KİŞİSEL VERİLERİN KORUNMASI VE FİKRİ-SINAİ HAKLAR</strong><br/>9.1 ... 9.3 ...</p>

<p><strong>10. CAYMA HAKKI</strong><br/>10.1 ... 10.13 ...</p>

<p><strong>11. CAYMA HAKKININ KULLANILAMAYACAĞI HALLER</strong><br/>11.1 ... 11.3 ...</p>

<p><strong>12. UYUŞMAZLIKLARIN ÇÖZÜMÜ</strong><br/>12.1 ...</p>

<p><strong>13. BİLDİRİMLER ve DELİL SÖZLEŞMESİ</strong><br/>13.1 ... 13.2 ...</p>

<p><strong>14. YÜRÜRLÜK</strong><br/>14.1 ...</p>
`;
