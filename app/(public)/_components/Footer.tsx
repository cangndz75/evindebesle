import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#f3f1ee] text-[#3a2f29] px-6 md:px-24 py-14 text-sm font-light tracking-wide">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-20">
        {/* Sol blok */}
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-6">evindebesle</h1>
          </div>
          <p className="text-xs text-[#6b6059]">
            © EvindeBesle 2025. Tüm hakları saklıdır.
          </p>
        </div>

        {/* Orta blok */}
        <div className="leading-7 text-[15px]">
          <p className="font-medium">evindebesle bir DogoPet hizmetidir.</p>
          <p>
            Uptwins Blok, Orta, Yalnız Selvi Cd. No : 5AB, 34880 Kartal/İstanbul
          </p>
          <p className="mt-2">
            Kurumsal E-Posta:{" "}
            <a href="mailto:info@evindebesle.com" className="underline">
              info@evindebesle.com
            </a>
          </p>
          <p>
            <a href="https://evindebesle.com" className="underline">
              evindebesle.com
            </a>
          </p>
        </div>

        <div className="flex flex-col justify-between">
          <div className="space-y-2 text-[15px]">
            <Link href="/kvkk" className="block hover:underline">
              KVKK Aydınlatma Metni
            </Link>
            <Link href="/contract" className="block hover:underline">
              Üyelik Sözleşmesi
            </Link>
            <Link href="/contact" className="block hover:underline">
              İletişim
            </Link>
            <Link href="/service" className="block hover:underline">
              Teslimat ve İade Şartları
            </Link>
            <Link href="/privacy" className="block hover:underline">
              Gizlilik Sözleşmesi
            </Link>
            <Link href="/distance-selling" className="block hover:underline">
              Kullanım Şartları
            </Link>
          </div>

          <div className="mt-6 flex flex-col items-end">
            <div className="flex gap-3">
              <Image
                src="https://res.cloudinary.com/dlahfchej/image/upload/v1753708468/logo_band_colored_2x_afo1no.png"
                alt="iyzico ile öde"
                width={300}
                height={32}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
