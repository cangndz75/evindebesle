// app/uyelik-sozlesmesi/page.tsx
"use client";

import Navbar from "@/app/(public)/_components/Navbar";
import Footer from "@/app/(public)/_components/Footer";
import { ScrollTextIcon } from "lucide-react";

export default function MembershipAgreementPage() {
  return (
    <>
      <Navbar />
      <div className="bg-white py-10">
        <div className="max-w-4xl mx-auto px-4 text-sm leading-7">
          <div className="flex items-center gap-2 mb-6">
            <ScrollTextIcon className="text-purple-600 w-6 h-6" />
            <h1 className="text-2xl font-bold">Üyelik Sözleşmesi</h1>
          </div>

          <h2 className="text-lg font-semibold mt-6 mb-2">1. Taraflar</h2>
          <p className="mb-4">
            Evindebesle Üyelik Sözleşmesi (“Sözleşme”), www.evindebesle.com
            (“Site”) internet sitesinin sahibi ve işleticisi ile bu Site’ye üye
            olan kişi (“Üye”) arasında akdedilmiştir.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">
            2. Sözleşmenin Konusu
          </h2>
          <p className="mb-4">
            Bu Sözleşme’nin konusu, Üye’nin evindebesle.com üzerinden sunulan
            hizmetlerden hangi koşullarla yararlanabileceğini düzenlemektir.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">
            3. Tarafların Hak ve Yükümlülükleri
          </h2>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>
              Üye, doğru ve güncel bilgilerle kayıt oluşturduğunu kabul eder.
            </li>
            <li>
              Üye, yürürlükteki mevzuata ve belirlenen kurallara uygun
              davranacağını taahhüt eder.
            </li>
            <li>Site üzerindeki tüm işlemlerden Üye sorumludur.</li>
            <li>Hizmetler sadece hukuka uygun şekilde kullanılabilir.</li>
            <li>
              Diğer kullanıcıların verilerine erişmek, sistemi ihlal etmek
              yasaktır.
            </li>
            <li>Şifre kişiseldir, üçüncü kişilerle paylaşılamaz.</li>
            <li>
              Site, gerekli gördüğünde üyeliği askıya alabilir veya
              sonlandırabilir.
            </li>
            <li>
              İçeriklerin telif hakları EvindeBesle’ye aittir, izinsiz
              kullanılamaz.
            </li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">
            4. Ticari Elektronik İletiler
          </h2>
          <p className="mb-4">
            Üye, e-posta ve SMS gibi kanallardan tanıtım iletisi almayı kabul
            edebilir. Onay her zaman İYS veya profil üzerinden geri alınabilir.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">
            5. Kişisel Verilerin Korunması
          </h2>
          <p className="mb-4">
            Kişisel veriler KVKK ve ilgili mevzuata uygun şekilde işlenir.
            Detaylı bilgi için{" "}
            <a href="/kvkk" className="underline text-blue-600">
              KVKK Aydınlatma Metni
            </a>{" "}
            sayfasını inceleyebilirsiniz.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">6. Tebligat</h2>
          <p className="mb-4">
            Sözleşmeye ilişkin tebligatlar, üyelik sırasında beyan edilen
            e-posta veya posta adreslerine yapılır.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">
            7. Sözleşmenin Feshi
          </h2>
          <p className="mb-4">
            Taraflardan her biri bu sözleşmeyi tek taraflı olarak feshedebilir.
            Kurallara aykırı kullanım durumunda üyelik sonlandırılabilir.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">
            8. Uyuşmazlıkların Çözümü
          </h2>
          <p className="mb-4">
            Taraflar arasında doğacak ihtilaflarda İstanbul Merkez Mahkemeleri
            ve İcra Daireleri yetkilidir.
          </p>

          <h2 className="text-lg font-semibold mt-6 mb-2">9. Yürürlük</h2>
          <p className="mb-4">
            Üye’nin siteye kaydolmasıyla bu sözleşme yürürlüğe girer. Üyelik
            sona erene kadar geçerlidir.
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
