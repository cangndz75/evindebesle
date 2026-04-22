import Link from "next/link";
import { DISTANCE_SALES_SELLER_DEFAULT } from "@/lib/legal/distance-sales-seller-constants";

const s = DISTANCE_SALES_SELLER_DEFAULT;

type Props = {
  className?: string;
  /** true: /checkout linki gösterme (modal veya zaten checkout sayfası) */
  omitCheckoutLink?: boolean;
};

export default function DistanceSellingBody({ className = "", omitCheckoutLink }: Props) {
  return (
    <div className={`text-gray-800 leading-relaxed space-y-8 text-[15px] ${className}`}>
      <section>
        <h2 className="text-xl font-semibold mb-3">MADDE 1 - TARAFLAR</h2>
        <h3 className="text-lg font-medium mb-2">1.1. SATICI BİLGİLERİ</h3>
        <p className="space-y-1">
          <strong>Unvanı:</strong> {s.legalTitle}
          <br />
          <strong>Adresi:</strong> {s.address}
          <br />
          <strong>Telefon:</strong> {s.phone}
          <br />
          <strong>E-posta:</strong>{" "}
          <a href={`mailto:${s.email}`} className="text-blue-600 hover:underline">
            {s.email}
          </a>
          <br />
          <strong>İnternet Sitesi:</strong>{" "}
          <a href={s.website} className="text-blue-600 hover:underline">
            {s.website.replace(/^https?:\/\//, "")}
          </a>
          <br />
          <strong>MERSİS No:</strong> {s.mersis}
          <br />
          <strong>Vergi Dairesi ve No:</strong> {s.taxOffice} — {s.taxNumber}
        </p>

        <h3 className="text-lg font-medium mt-4 mb-2">1.2. ALICI (TÜKETİCİ) BİLGİLERİ</h3>
        <p>
          <strong>Adı/Soyadı/Unvanı:</strong> Sipariş aşamasında sistemden otomatik çekilecektir.
          <br />
          <strong>Teslimat Adresi:</strong> Sipariş aşamasında sistemden otomatik çekilecektir.
          <br />
          <strong>Telefon:</strong> Sipariş aşamasında sistemden otomatik çekilecektir.
          <br />
          <strong>E-posta:</strong> Sipariş aşamasında sistemden otomatik çekilecektir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">MADDE 2 - KONU</h2>
        <p>
          İşbu Sözleşme&apos;nin konusu, ALICI&apos;nın SATICI&apos;ya ait dark-velvet.com internet sitesinden
          elektronik ortamda siparişini yaptığı, aşağıda nitelikleri ve satış fiyatı belirtilen
          ürünün/ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve
          29188 sayılı Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin
          belirlenmesidir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">MADDE 3 - SÖZLEŞME KONUSU ÜRÜN BİLGİLERİ VE ÖDEME</h2>
        <p className="mb-2">
          <strong>3.1.</strong> Ürünlerin cinsi ve türü, miktarı, marka/modeli, rengi ve tüm vergiler dâhil satış bedeli
          (adet × birim fiyat olarak) sipariş özetinde ve ödeme sonrası e-postanıza iletilecek şekilde kayıt altına
          alınır. Örnek yer tutucu liste:
        </p>
        <p className="italic text-gray-600 mb-2">[Sepetteki ürünlerin listesi, adedi ve birim fiyatları]</p>
        <p>
          <strong>Ara Toplam:</strong> [Tutar] TL
          <br />
          <strong>Kargo Ücreti:</strong> [Kargo tutarı] TL
          <br />
          <strong>Toplam Tutar (Vergiler Dâhil):</strong> [Toplam tutar] TL
        </p>
        <p className="mt-2">
          <strong>3.2. Ödeme Şekli ve Planı:</strong> [Kredi kartı / Havale / EFT / Kapıda ödeme vb.]
        </p>
        <p>
          <strong>3.3. Teslimat Şartları:</strong> Ürün/ürünler, ALICI&apos;nın yukarıda belirtilen teslimat adresine,
          SATICI&apos;nın anlaşmalı olduğu kargo firması <strong>[Kargo firması adı]</strong> aracılığıyla teslim
          edilecektir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">MADDE 4 - SATICININ BEYAN VE TAAHHÜTLERİ</h2>
        <p>
          <strong>4.1.</strong> SATICI, sözleşme konusu ürünün sağlam, eksiksiz, siparişte belirtilen niteliklere uygun
          ve varsa garanti belgeleri ve kullanım kılavuzları ile teslim edilmesinden sorumludur.
        </p>
        <p>
          <strong>4.2.</strong> SATICI, haklı bir nedenle sözleşme konusu ürünün tedarik edilemeyeceğinin anlaşılması
          hâlinde, bu durumu öğrendiği tarihten itibaren 3 (üç) gün içinde ALICI&apos;yı bilgilendirmek ve 14 (on
          dört) gün içinde tahsil edilen tüm ödemeleri iade etmek kaydıyla sözleşmeyi feshedebilir. Ürünün stokta
          bulunmaması imkânsızlaşma olarak kabul edilmez.
        </p>
        <p>
          <strong>4.3.</strong> SATICI, malın ALICI&apos;ya veya ALICI&apos;nın gösterdiği üçüncü kişiye teslimine kadar
          oluşan kayıp ve hasarlardan sorumludur.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">MADDE 5 - ALICININ BEYAN VE TAAHHÜTLERİ</h2>
        <p>
          <strong>5.1.</strong> ALICI, dark-velvet.com internet sitesinde sözleşme konusu ürünün temel nitelikleri,
          satış fiyatı, ödeme şekli ve teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda
          gerekli teyidi verdiğini beyan eder.
        </p>
        <p>
          <strong>5.2.</strong> ALICI, ürünü kargodan teslim almadan önce muayene edecek; ezik, kırık, ambalajı yırtılmış
          vb. hasarlı ve ayıplı mal/hizmeti kargo şirketinden teslim almayacak ve tutanak tutturacaktır. Teslim alınan
          ürünün hasarsız ve sağlam olduğu kabul edilecektir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">MADDE 6 - TESLİMAT SÜRESİ</h2>
        <p>
          <strong>6.1.</strong> Satın alınan ürün/ürünler, taahhüt edilen sürede teslim edilir. Bu süre her halükarda
          siparişin SATICI&apos;ya ulaşmasından itibaren yasal sınır olan 30 (otuz) günü geçemez.
        </p>
        <p>
          <strong>6.2.</strong> Ürün, ALICI&apos;dan başka bir kişi/kuruluşa teslim edilecek ise, teslim edilecek
          kişi/kuruluşun teslimatı kabul etmemesinden SATICI sorumlu tutulamaz.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">MADDE 7 - CAYMA HAKKI</h2>
        <p>
          <strong>7.1.</strong> ALICI, mal satışına ilişkin mesafeli sözleşmelerde, ürünün kendisine veya gösterdiği
          adresteki kişi/kuruluşa teslim tarihinden itibaren 14 (on dört) gün içerisinde hiçbir hukuki ve cezai
          sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden cayma hakkına sahiptir.
        </p>
        <p>
          <strong>7.2.</strong> Cayma hakkının kullanılması için bu süre içerisinde SATICI&apos;nın yukarıda belirtilen
          iletişim adreslerine (e-posta veya telefon ile) açık bir şekilde bildirimde bulunulması şarttır.
        </p>
        <p>
          <strong>7.3.</strong> Cayma hakkının kullanılması hâlinde: ALICI, cayma bildirimini SATICI&apos;ya yönelttiği
          tarihten itibaren 10 (on) gün içinde ürünü SATICI&apos;ya iade etmek zorundadır. İade edilecek ürünlerin
          kutusu, ambalajı, varsa standart aksesuarları ile birlikte eksiksiz ve hasarsız olarak teslim edilmesi
          gerekmektedir.
        </p>
        <p>
          <strong>7.4.</strong> SATICI, cayma bildiriminin kendisine ulaşmasından itibaren 14 (on dört) gün içinde
          ALICI&apos;nın yaptığı tüm ödemeleri (varsa teslimat masrafları dâhil) ALICI&apos;nın satın alırken
          kullandığı ödeme aracına uygun şekilde tek seferde iade edecektir.
        </p>
        <p>
          <strong>7.5.</strong> İade işleminde kargo bedeli, SATICI&apos;nın ön bilgilendirme formunda belirttiği
          anlaşmalı kargo şirketi <strong>[Anlaşmalı kargo şirketi adı]</strong> ile gönderilmesi şartıyla SATICI&apos;ya
          aittir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">MADDE 8 - CAYMA HAKKININ KULLANILAMAYACAĞI HALLER</h2>
        <p>Aşağıdaki ürün gruplarında yasa gereği cayma hakkı kullanılamaz:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>
            <strong>İç giyim ve hijyenik ürünler:</strong> Tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu
            unsurları açılmış olması kaydıyla; iç çamaşırı, mayo, bikini, küpe vb. iadesi sağlık ve hijyen açısından
            uygun olmayan ürünler. (Dark Velvet üzerinden satın alınan iç giyim ve aksesuar ürünlerinde, ürünün hijyen
            bandının veya koruyucu ambalajının açılmış, denenmiş veya kullanılmış olması hâlinde cayma hakkı geçerli
            değildir.)
          </li>
          <li>Tüketicinin özel istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan, özelleştirilmiş mallar.</li>
          <li>Çabuk bozulabilen veya son kullanma tarihi geçebilecek mallar.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">MADDE 9 - UYUŞMAZLIKLARIN ÇÖZÜMÜ</h2>
        <p>
          İşbu sözleşmenin uygulanmasında ve çıkabilecek uyuşmazlıklarda, Ticaret Bakanlığı tarafından her yıl aralık
          ayında belirlenen parasal sınırlar dâhilinde ALICI&apos;nın veya SATICI&apos;nın yerleşim yerindeki Tüketici
          Hakem Heyetleri, bu sınırları aşan durumlarda ise Tüketici Mahkemeleri yetkilidir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">MADDE 10 - YÜRÜRLÜK</h2>
        <p>
          ALICI, Site üzerinden verdiği siparişe ait ödemeyi gerçekleştirdiğinde işbu sözleşmenin tüm şartlarını kabul
          etmiş sayılır. SATICI, siparişin gerçekleşmesi öncesinde işbu sözleşmenin sitede ALICI tarafından okunup kabul
          edildiğine dair gerekli yazılımsal düzenlemeleri yapmakla yükümlüdür.
        </p>
        <p className="mt-4 text-sm text-gray-600 border-t border-gray-200 pt-4">
          Sipariş tamamlandığında, kişiselleştirilmiş sözleşme metni ve ürün kalemleri{" "}
          {omitCheckoutLink ? (
            <span className="text-gray-700 font-medium">ödeme sırasında kullandığınız e-posta adresine</span>
          ) : (
            <Link href="/checkout" className="text-blue-600 hover:underline">
              ödeme sırasında kullandığınız e-posta adresine
            </Link>
          )}{" "}
          iletilir.
        </p>
      </section>
    </div>
  );
}
