// app/mesafeli-satis-sozlesmesi/page.tsx
"use client";

import { ScrollTextIcon } from "lucide-react";
import Navbar from "@/app/(public)/_components/Navbar";
import Footer from "@/app/(public)/_components/Footer";

export default function TermsOfSalePage() {
  return (
    <>
      <Navbar />
      <div className="bg-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <ScrollTextIcon className="text-yellow-600 w-6 h-6" />
            <h1 className="text-2xl font-bold">Mesafeli Satış Sözleşmesi</h1>
          </div>

          <p className="mb-6 text-sm text-muted-foreground">
            Bu sözleşme, <strong>www.evindebesle.com</strong> web sitesi
            üzerinden hizmet satın alan kullanıcılar ile hizmet sağlayıcı
            Evindebesle arasında, 6502 sayılı Tüketicinin Korunması Hakkında
            Kanun ve Mesafeli Sözleşmelere Dair Yönetmelik hükümlerine uygun
            olarak düzenlenmiştir.
          </p>

          <h2 className="text-lg font-semibold mb-2">1. Taraflar</h2>
          <p className="mb-4">
            <strong>Satıcı:</strong> Evindebesle (Ticaret Unvanı, Vergi
            Numarası, Adres)
            <br />
            <strong>Alıcı:</strong> Web sitesinden sipariş veren kullanıcı.
          </p>

          <h2 className="text-lg font-semibold mb-2">2. Konu</h2>
          <p className="mb-4">
            İşbu sözleşmenin konusu, Alıcı’nın Satıcı’ya ait internet sitesi
            üzerinden elektronik ortamda siparişini verdiği hizmetlerin satışı
            ve sunulmasına ilişkin 6502 sayılı Tüketicinin Korunması Hakkında
            Kanun ve ilgili yönetmelikler çerçevesinde tarafların hak ve
            yükümlülüklerini belirlemektir.
          </p>

          <h2 className="text-lg font-semibold mb-2">
            3. Sözleşme Konusu Hizmet
          </h2>
          <p className="mb-4">
            Evcil hayvan bakım, gezdirme, mama teslimi ve benzeri hizmetlerin,
            kullanıcının talep ettiği tarih ve saatte belirtilen adrese
            görevliler aracılığıyla sunulması.
          </p>

          <h2 className="text-lg font-semibold mb-2">4. Ödeme ve İade</h2>
          <ul className="list-disc list-inside mb-6 space-y-1">
            <li>
              Ödeme, kredi kartı, banka kartı veya iyzico altyapısı ile
              yapılabilir.
            </li>
            <li>
              Kullanıcı, hizmet saatinden <strong>en az 12 saat önce</strong>{" "}
              iptal yaparsa ücret iadesi yapılır.
            </li>
            <li>İptal süresi aşılmışsa, yalnızca kupon tanımlanabilir.</li>
            <li>
              Hizmet sağlayıcı kaynaklı iptallerde tam ücret iadesi yapılır.
            </li>
          </ul>

          <h2 className="text-lg font-semibold mb-2">5. Cayma Hakkı</h2>
          <p className="mb-4">
            Kullanıcı, hizmete başlanmamışsa, 14 gün içinde hiçbir gerekçe
            göstermeksizin cayma hakkını kullanabilir. Cayma bildirimi{" "}
            <a
              href="mailto:info@evindebesle.com"
              className="underline text-blue-600"
            >
              info@evindebesle.com
            </a>{" "}
            adresine yapılmalıdır.
          </p>

          <h2 className="text-lg font-semibold mb-2">6. Uyuşmazlık</h2>
          <p className="mb-4">
            İşbu sözleşmeden doğabilecek uyuşmazlıklarda, Tüketici Hakem
            Heyetleri ve Tüketici Mahkemeleri yetkilidir.
          </p>

          <h2 className="text-lg font-semibold mb-2">7. Yürürlük</h2>
          <p className="mb-4">
            Alıcı, site üzerinden ödeme yaparak bu sözleşmenin tüm koşullarını
            kabul etmiş sayılır.
          </p>

          <p className="text-muted-foreground text-xs">
            Bu sözleşme en son {new Date().toLocaleDateString("tr-TR")}{" "}
            tarihinde güncellenmiştir.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
