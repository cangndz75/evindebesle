"use client";

import { Handshake } from "lucide-react";
import Navbar from "@/app/(public)/_components/Navbar";
import Footer from "@/app/(public)/_components/Footer";

export default function DistanceSellingPage() {
  return (
    <>
      <div className="container mx-auto p-6 bg-white shadow-md rounded-lg max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <Handshake className="text-teal-600 w-6 h-6" />
          <h1 className="text-2xl font-bold">Mesafeli Satış Sözleşmesi</h1>
        </div>
        <div className="text-gray-700 leading-relaxed">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Madde 1 - Taraflar</h2>
            <h3 className="text-xl font-medium mb-2">
              1.1. Hizmet Sağlayıcı (Satıcı)
            </h3>
            <p>
              <strong>Ünvan:</strong> Dogo Petshop LTD. ŞTİ.
              <br />
              <strong>Adres:</strong> Uptwins Blok, Orta, Yalnız Selvi Cd. No :
              5AB, 34880 Kartal/İstanbul
              <br />
              <strong>Mersis No:</strong> 0302111904500001
              <br />
              <strong>Vergi Dairesi ve No:</strong> Yakacık VD, 3021119045
              <br />
              <strong>Telefon:</strong> +90 216 519 26 00
              <br />
              <strong>E-posta:</strong> info@evindebesle.com
              <br />
              <strong>Web Sitesi:</strong>{" "}
              <a
                href="https://www.evindebesle.com"
                className="text-blue-600 hover:underline"
              >
                www.evindebesle.com
              </a>
            </p>
            <h3 className="text-xl font-medium mb-2 mt-4">1.2. Alıcı</h3>
            <p>
              <strong>Ad Soyad:</strong> [Alıcının Adı Soyadı]
              <br />
              <strong>Adres:</strong> [Hizmetin Sağlanacağı Adres]
              <br />
              <strong>Telefon:</strong> [Alıcının Telefon Numarası]
              <br />
              <strong>E-posta:</strong> [Alıcının E-posta Adresi]
              <br />
              (Bu bilgiler, alıcı tarafından sipariş esnasında elektronik
              ortamda sağlanacaktır.)
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Madde 2 - Sözleşmenin Konusu
            </h2>
            <p>
              İşbu Sözleşme, Alıcı’nın, Satıcı’ya ait{" "}
              <a
                href="https://www.evindebesle.com"
                className="text-blue-600 hover:underline"
              >
                www.evindebesle.com
              </a>{" "}
              internet sitesi üzerinden elektronik ortamda satın aldığı, aşağıda
              nitelikleri ve satış fiyatı belirtilen evcil hayvan bakım
              hizmetlerinin (örneğin, evde besleme, gezdirme, bakım) sunulması
              ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun
              ve Mesafeli Sözleşmelere Dair Yönetmelik hükümleri gereğince
              tarafların hak ve yükümlülüklerini düzenler.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Madde 3 - Sözleşme Konusu Hizmet
            </h2>
            <p>
              Hizmetin türü, kapsamı, süresi, ücreti ve ödeme şekli,{" "}
              <a
                href="https://www.evindebesle.com"
                className="text-blue-600 hover:underline"
              >
                www.evindebesle.com
              </a>{" "}
              internet sitesinde yer aldığı şekliyle ve Alıcı tarafından sipariş
              esnasında onaylanan şekilde aşağıda belirtilmiştir:
              <br />
              <strong>Hizmet Türü:</strong> [Örnek: Evde Evcil Hayvan Besleme ve
              Gezdirme]
              <br />
              <strong>Hizmet Süresi:</strong> [Örnek: 5 Gün, Günde 2 Ziyaret]
              <br />
              <strong>Hizmet Başlangıç Tarihi:</strong> [Başlangıç Tarihi]
              <br />
              <strong>Hizmet Bitiş Tarihi:</strong> [Bitiş Tarihi]
              <br />
              <strong>Evcil Hayvan Bilgileri:</strong> [Evcil Hayvan Türü, Adı,
              Özel İhtiyaçlar]
              <br />
              <strong>Hizmet Ücreti:</strong> [Hizmet Ücreti] TL (KDV Dahil)
              <br />
              <strong>Ödeme Şekli:</strong> Kredi Kartı / Banka Kartı 
              <br />
              <strong>Hizmetin Sağlanacağı Adres:</strong> [Alıcının Adresi]
              <br />
              <strong>Fatura Edilecek Kişi/Kurum:</strong> [Fatura Bilgileri]
            </p>
          </section>

          {/* <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Madde 4 - Ödeme ve iyzico Entegrasyonu
            </h2>
            <p>
              4.1. Ödemeler, iyzico ödeme sistemleri aracılığıyla güvenli bir
              şekilde gerçekleştirilir. Alıcı,{" "}
              <a
                href="https://www.evindebesle.com"
                className="text-blue-600 hover:underline"
              >
                www.evindebesle.com
              </a>{" "}
              üzerinden siparişini tamamladıktan sonra, iyzico ödeme ekranına
              yönlendirilir ve ödeme işlemi iyzico’nun güvenli altyapısı
              üzerinden tamamlanır.
              <br />
              4.2. Ödeme, kredi kartı, banka kartı veya iyzico’nun sunduğu diğer
              ödeme yöntemleriyle (örneğin, iyzico Link ile Ödeme) yapılabilir.
              iyzico, ödeme işlemlerinde 3D Secure sistemini kullanır ve
              Alıcı’nın ödeme güvenliğini sağlamak için gerekli tüm önlemleri
              alır.
              <br />
              4.3. Alıcı, ödeme işlemini tamamlamadan önce siparişin ödeme
              yükümlülüğü getirdiğini açıkça kabul eder. Ödeme işlemi
              tamamlandıktan sonra, iyzico tarafından Satıcı’ya ödeme onayı
              bildirilir.
              <br />
              4.4. Harcama itirazları durumunda, iyzico’nun ilgili banka veya
              kart hamiliyle iletişime geçerek süreci yöneteceği kabul edilir.
              Alıcı, harcama itirazı nedeniyle iyzico’nun uğrayacağı zararları
              (örneğin, geri ödeme veya idari yaptırımlar) Satıcı’ya rücu etme
              hakkına sahip olduğunu kabul eder.
              <br />
              4.5. Ödeme işlemleri, iyzico’nun Çerçeve E-Para İhracı ve Ödeme
              Hizmeti Sözleşmesi’ne tabidir. Alıcı, bu sözleşmeyi iyzico
              platformunda onaylamış olduğunu beyan eder.
            </p>
          </section> */}

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Madde 5 - Hizmetin Sunumu
            </h2>
            <p>
              5.1. Sözleşme konusu hizmet, Alıcı’nın belirttiği adreste ve
              kararlaştırılan tarihlerde sunulur. Hizmet, sipariş tarihinde
              belirtilen başlangıç tarihinden itibaren, belirtilen süre boyunca
              sağlanır.
              <br />
              5.2. Hizmet, Satıcı’nın profesyonel personeli veya anlaşmalı
              hizmet sağlayıcıları tarafından sunulur. Alıcı, hizmetin
              sağlanacağı adresin erişilebilir olduğunu ve evcil hayvanın sağlık
              durumunun hizmete uygun olduğunu garanti eder.
              <br />
              5.3. Alıcı, hizmet öncesinde evcil hayvanın özel ihtiyaçlarını
              (örneğin, diyet, ilaç, davranış özellikleri) Satıcı’ya yazılı
              olarak bildirmekle yükümlüdür.
              <br />
              5.4. Hizmetin sağlanamaması durumunda (örneğin, Alıcı’nın
              adresinde bulunmaması veya evcil hayvana erişilememesi), Satıcı
              edimini tam ve eksiksiz olarak yerine getirmiş sayılır.
              <br />
              5.5. Satıcı, hizmet sırasında evcil hayvanın güvenliği ve sağlığı
              için gerekli özeni gösterir. Ancak, evcil hayvanın mevcut sağlık
              sorunlarından veya öngörülemeyen durumlardan kaynaklanan zararlar
              Satıcı’nın sorumluluğunda değildir.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Madde 6 - Cayma Hakkı
            </h2>
            <p>
              6.1. Alıcı, hizmetin sağlanmasına başlanmadan önce 14 (on dört)
              gün içinde, Satıcı’ya bildirmek kaydıyla hiçbir gerekçe
              göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına
              sahiptir.
              <br />
              6.2. Hizmetin sağlanmasına başlandıktan sonra cayma hakkı
              kullanılamaz, çünkü hizmet, Mesafeli Sözleşmelere Dair Yönetmelik
              uyarınca cayma hakkının istisnalarından olan “belirli bir tarihte
              veya dönemde yapılması gereken hizmetler” kapsamındadır.
              <br />
              6.3. Cayma hakkının kullanılması için Alıcı, 14 günlük süre içinde
              Satıcı’ya yazılı olarak (e-posta: info@evindebesle.com) bildirimde
              bulunmalıdır.
              <br />
              6.4. Cayma hakkının kullanılması durumunda, Alıcı’nın ödediği
              tutar, iyzico aracılığıyla 14 gün içinde iade edilir.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Madde 7 - Hizmet Garantisi
            </h2>
            <p>
              7.1. Satıcı, hizmetin kararlaştırılan niteliklere uygun şekilde
              sunulacağını garanti eder.
              <br />
              7.2. Hizmetin eksik veya hatalı sunulması durumunda, Alıcı, durumu
              hizmetin tamamlanmasından itibaren 7 gün içinde Satıcı’ya
              bildirmelidir. Satıcı, şikayeti inceleyerek telafi edici bir
              hizmet sunabilir veya ücreti iade edebilir.
              <br />
              7.3. Alıcı’nın, evcil hayvanın özel ihtiyaçlarını veya adres
              bilgilerini doğru şekilde bildirmemesi durumunda, hizmetin eksik
              sunulmasından Satıcı sorumlu tutulamaz.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Madde 8 - Alıcı’nın Yükümlülükleri
            </h2>
            <p>
              8.1. Alıcı, internet sitesinde hizmetin temel nitelikleri, ücreti,
              ödeme şekli ve sunum koşullarını okuyup bilgi sahibi olduğunu ve
              elektronik ortamda gerekli teyidi verdiğini kabul eder.
              <br />
              8.2. Alıcı, hizmet bedelini tam ve eksiksiz olarak ödemekle
              yükümlüdür.
              <br />
              8.3. Alıcı, hizmetin sağlanacağı adresin erişilebilirliğini ve
              evcil hayvanın sağlık durumunun hizmete uygun olduğunu sağlamakla
              yükümlüdür.
              <br />
              8.4. Alıcı, hizmet sırasında kullanılacak anahtar veya erişim
              yöntemlerini Satıcı’ya güvenli bir şekilde sağlamakla yükümlüdür.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Madde 9 - Satıcı’nın Yükümlülükleri
            </h2>
            <p>
              9.1. Satıcı, sözleşme konusu hizmeti, kararlaştırılan tarihlerde
              ve niteliklerde sunmakla yükümlüdür.
              <br />
              9.2. Satıcı, Alıcı’yı hizmet süreci, ödeme ve iptal koşulları
              hakkında açık ve anlaşılır şekilde bilgilendirmekle yükümlüdür.
              <br />
              {/* 9.3. Satıcı, iyzico aracılığıyla gerçekleştirilen ödemelerin
              güvenliğini sağlamak için gerekli tüm önlemleri alır.
              <br /> */}
              9.3. Satıcı, hizmet sırasında evcil hayvanın güvenliği ve sağlığı
              için gerekli özeni gösterir.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Madde 10 - Uyuşmazlıkların Çözümü
            </h2>
            <p>
              İşbu Sözleşme’den doğan uyuşmazlıklarda, Alıcı’nın yerleşim
              yerinin bulunduğu veya hizmetin sağlandığı yerdeki Tüketici
              Sorunları Hakem Heyeti veya Tüketici Mahkemesi yetkilidir. Alıcı,
              şikayet ve itirazlarını bu mercilere iletebilir.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Madde 11 - Sözleşmenin Feshi
            </h2>
            <p>
              11.1. İşbu Sözleşme, Alıcı tarafından elektronik ortamda
              onaylanmasıyla yürürlüğe girer ve taraflarca feshedilmediği sürece
              yürürlükte kalır.
              <br />
              11.2. Taraflar, 1 (bir) ay öncesinden yazılı bildirimle
              Sözleşme’yi feshedebilir.
              <br />
              11.3. Taraflardan birinin sözleşmesel yükümlülüklerini ihlal
              etmesi ve ihlalin 1 hafta içinde düzeltilmemesi durumunda, diğer
              taraf Sözleşme’yi tazminatsız feshedebilir.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Madde 12 - Son Hükümler
            </h2>
            <p>
              12.1. İşbu Sözleşme, elektronik ortamda Alıcı tarafından
              onaylanarak yürürlüğe girer.
              <br />
              12.2. Sözleşme, 3 (üç) yıl süreyle Satıcı tarafından saklanır.
              <br />
              12.3. Sözleşme’nin bir veya birkaç maddesinin geçersiz olması,
              diğer maddelerin geçerliliğini etkilemez.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
