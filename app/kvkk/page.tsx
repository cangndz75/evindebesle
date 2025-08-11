// app/kvkk/page.tsx
"use client";

import { FileTextIcon } from "lucide-react";
import Navbar from "@/app/(public)/_components/Navbar";
import Footer from "@/app/(public)/_components/Footer"; // varsa buraya yerleştir, yoksa düz div yaz

export default function KVKKPage() {
  return (
    <>
      <div className="bg-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <FileTextIcon className="text-purple-600 w-6 h-6" />
            <h1 className="text-2xl font-bold">KVKK Aydınlatma Metni</h1>
          </div>

          <h2 className="text-lg font-semibold mb-4">
            KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA VE RIZA METNİ
          </h2>

          <p className="mb-6">
            İşbu Aydınlatma ve Rıza Metni’nin amacı,{" "}
            <strong>evindebesle.com</strong> web sitesi ve platformuna
            (“Platform”) üye olan kişiler (“Kullanıcı(lar)”) tarafından sağlanan
            kişisel verilerin, 6698 sayılı{" "}
            <strong>Kişisel Verilerin Korunması Kanunu</strong> (“Kanun”)
            uyarınca işlenmesine ilişkin esasları açıklamak ve rıza alınmasını
            sağlamaktır.
          </p>

          <h3 className="font-semibold mb-2">Hangi Veriler İşlenmektedir?</h3>
          <p className="mb-2">
            Evindebesle.com tarafından işlenebilecek kişisel veriler şunlardır:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-1">
            <li>Kimlik Bilgileri (ad, soyad, doğum tarihi, cinsiyet)</li>
            <li>İletişim Bilgileri (telefon, e-posta, adres)</li>
            <li>Evcil hayvan bilgileri (tür, yaş, hassasiyet vb.)</li>
            <li>Hizmet talepleri ve randevu geçmişi</li>
            <li>Ödeme ve fatura bilgileri</li>
            <li>Yüklenen görseller, hizmet sonrası medya içerikleri</li>
          </ul>

          <h3 className="font-semibold mb-2">
            Veriler Hangi Amaçlarla Kullanılmaktadır?
          </h3>
          <ul className="list-disc list-inside mb-6 space-y-1">
            <li>Üyelik kaydının oluşturulması ve doğrulanması</li>
            <li>
              Hizmet eşleştirme, rezervasyon ve takip süreçlerinin yönetilmesi
            </li>
            <li>Kullanıcı deneyiminin iyileştirilmesi</li>
            <li>İletişim ve bilgilendirme faaliyetleri</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>İstatistiksel analizler ve sistem güvenliğinin sağlanması</li>
          </ul>

          <h3 className="font-semibold mb-2">
            Veriler Kimlerle Paylaşılmaktadır?
          </h3>
          <p className="mb-6">
            Kişisel verileriniz; hizmet sağlayıcılar, ödeme sistemleri, sosyal
            medya platformları, barındırma firmaları, danışmanlık firmaları,
            ajanslar, ve yasal yükümlülük gereği kamu kurumlarıyla
            paylaşılabilir.
          </p>

          <h3 className="font-semibold mb-2">Haklarınız ve Başvuru</h3>
          <p className="mb-6">
            KVKK’nın 11. maddesi kapsamında; veri işlenip işlenmediğini öğrenme,
            işlenmişse silinmesini veya düzeltilmesini talep etme, aktarım
            yapılan üçüncü kişileri öğrenme ve zararların giderilmesini talep
            etme haklarına sahipsiniz. Taleplerinizi{" "}
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
