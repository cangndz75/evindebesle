// app/teslimat-ve-iade/page.tsx
"use client";

import { TruckIcon } from "lucide-react";
import Navbar from "@/app/(public)/_components/Navbar";
import Footer from "@/app/(public)/_components/Footer";

export default function TeslimatVeIadePage() {
  return (
    <>
      <div className="bg-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <TruckIcon className="text-green-600 w-6 h-6" />
            <h1 className="text-2xl font-bold">Teslimat ve İade Şartları</h1>
          </div>

          <h2 className="text-lg font-semibold mb-4">Teslimat Koşulları</h2>
          <p className="mb-6">
            <strong>evindebesle.com</strong> üzerinden alınan ürünler,
            sipariş sırasında belirtilen teslimat süreleri içerisinde
            adrese uygun şekilde ulaştırılır. Tüm
            ürünlerde kullanıcıların seçtiği beden ve renk
            detaylarına göre gönderim yapılır.
          </p>

          <ul className="list-disc list-inside mb-6 space-y-1">
            <li>
              Hizmetler yalnızca platformda belirtilen ilçe sınırları içinde
              verilir.
            </li>
            <li>
              Belirtilen hizmet süresi içinde hizmete başlanamaması durumunda
              kullanıcı bilgilendirilir.
            </li>
            <li>
              Hizmet öncesi kullanıcıdan özel hassasiyet bilgileri ve detay
              adres talep edilir.
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-4">
            İade ve İptal Koşulları
          </h2>
          <p className="mb-4">
            Siparişlerinizde iptal ve iade işlemleri aşağıdaki
            kurallara göre gerçekleştirilir:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-1">
            <li>
              Ürün teslimatından sonra <strong>14 gün içinde</strong> sebep göstermeksizin iade hakkınız bulunmaktadır.
            </li>
            <li>
              İade edilecek ürünün <strong>etiketinin sökülmemiş ve kullanılmamış</strong> olması gerekmektedir.
            </li>
            <li>
              Hijyen kuralları gereği küpe, iç giyim ve alt grup mayo ürünlerinde iade kabul edilmemektedir.
            </li>
            <li>
              Hizmet sağlayıcı kaynaklı iptallerde, kullanıcıya{" "}
              <strong>tam ücret iadesi</strong> yapılır veya talebe göre yeniden
              planlama sağlanır.
            </li>
            <li>
              Ödeme iadeleri, ödemenin yapıldığı kart veya yönteme göre{" "}
              <strong>7 iş günü</strong> içinde gerçekleştirilir.
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-4">İletişim</h2>
          <p className="mb-6">
            Teslimat veya iade işlemleriyle ilgili tüm taleplerinizi{" "}
            <a
              href="mailto:info@evindebesle.com"
              className="underline text-blue-600"
            >
              info@evindebesle.com
            </a>{" "}
            adresine iletebilirsiniz.
          </p>

          <p className="text-muted-foreground text-xs">
            Bu metin en son {new Date().toLocaleDateString("tr-TR")} tarihinde
            güncellenmiştir.
          </p>
        </div>
      </div>
    </>
  );
}
