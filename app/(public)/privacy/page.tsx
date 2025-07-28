"use client";

import { ShieldIcon } from "lucide-react";
import Navbar from "@/app/(public)/_components/Navbar";
import Footer from "@/app/(public)/_components/Footer";

export default function GizlilikPage() {
  return (
    <>
      <Navbar />
      <div className="bg-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <ShieldIcon className="text-teal-600 w-6 h-6" />
            <h1 className="text-2xl font-bold">Gizlilik Sözleşmesi</h1>
          </div>

          <p className="mb-6">
            <strong>Evindebesle.com</strong> olarak kişisel verilerinizin
            gizliliğine ve güvenliğine önem veriyoruz. Bu Gizlilik Sözleşmesi,
            tarafımıza ilettiğiniz kişisel verilerin nasıl toplandığını,
            kullanıldığını, saklandığını ve korunduğunu açıklamaktadır.
          </p>

          <h2 className="text-lg font-semibold mb-4">Toplanan Veriler</h2>
          <ul className="list-disc list-inside mb-6 space-y-1">
            <li>Ad, soyad, e-posta, telefon gibi iletişim bilgileri</li>
            <li>Evcil hayvan bilgileri, hizmet geçmişi ve kullanıcı notları</li>
            <li>Oturum geçmişi gibi teknik veriler</li>
          </ul>

          <h2 className="text-lg font-semibold mb-4">Veri Saklama ve Koruma</h2>
          <p className="mb-6">
            Tüm kişisel verileriniz, gizlilik ilkesine uygun olarak şifrelenmiş
            sunucularda saklanmakta ve yalnızca yetkili kişiler tarafından
            erişilebilmektedir.
          </p>
          <p className="mb-6 font-semibold text-red-700">
            Kredi kartı bilgileriniz <u>hiçbir şekilde tarafımızda saklanmaz</u>
            . Tüm ödeme işlemleri, güvenli altyapıya sahip üçüncü taraf ödeme
            servis sağlayıcısı olan <strong>iyzico</strong> üzerinden
            gerçekleştirilir.
          </p>
          <p className="mb-6">
            Sistemde yalnızca işlem geçmişi, ödeme tutarı, tarih ve işlem durumu
            gibi bilgiler kaydedilir. Kart numaranız, CVV kodu veya son kullanma
            tarihi gibi hassas ödeme verileri doğrudan iyzico sisteminde
            işlenir.
          </p>

          <h2 className="text-lg font-semibold mb-4">
            Verilerin Kullanım Amacı
          </h2>
          <ul className="list-disc list-inside mb-6 space-y-1">
            <li>
              Hizmetlerin sunulması, randevu planlaması ve kullanıcı desteği
            </li>
            <li>İyileştirme ve geliştirme amaçlı analiz çalışmaları</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>
              Kullanıcının açık rızasına dayalı pazarlama ve kampanya
              bildirimleri
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-4">Veri Paylaşımı</h2>
          <p className="mb-6">
            Kişisel verileriniz yalnızca hizmetlerin sağlanması amacıyla sınırlı
            olmak üzere; iş ortaklarımız, ödeme servis sağlayıcıları, teknik
            destek sağlayıcıları ve yasal merciler ile paylaşılabilir. Bu
            paylaşım, her zaman gizlilik yükümlülüğü kapsamında yapılır.
          </p>

          <h2 className="text-lg font-semibold mb-4">Haklarınız</h2>
          <p className="mb-6">
            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında; veri
            işlenip işlenmediğini öğrenme, eksik ya da yanlış işlenmiş verilerin
            düzeltilmesini isteme, silinmesini talep etme, aktarıldığı üçüncü
            tarafları öğrenme ve zararın giderilmesini isteme hakkına
            sahipsiniz. Tüm taleplerinizi{" "}
            <a
              href="mailto:info@evindebesle.com"
              className="underline text-blue-600"
            >
              info@evindebesle.com
            </a>{" "}
            adresine yazılı olarak iletebilirsiniz.
          </p>

          <p className="text-muted-foreground text-xs">
            Bu metin en son {new Date().toLocaleDateString("tr-TR")} tarihinde
            güncellenmiştir.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
