import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#f3f1ee] text-[#3a2f29] px-6 md:px-24 py-14 text-sm font-light tracking-wide">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-20">
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-6">evindebesle</h1>
            <p className="text-sm">İstanbul Ticaret Odası’na kayıtlıdır.</p>
          </div>
          <p className="text-xs text-[#6b6059]">
            © EvindeBesle 2025. Tüm hakları saklıdır.
          </p>
        </div>

        <div className="leading-7 text-[15px]">
          <p className="font-medium">evindebesle bir DogoPet hizmetidir.</p>
          <p>
            Uptwins Blok, Orta, Yalnız Selvi Cd. No : 5AB, 34880 Kartal/İstanbul
          </p>
          <p className="mt-1">Telefon: +90 216 519 26 00</p>
          <p className="mt-2">
            <a href="mailto:info@evindebesle.com" className="underline">
              info@evindebesle.com
            </a>
          </p>
        </div>

        {/* Sağ blok */}
        {/* Sağ blok */}
        <div className="flex flex-col justify-between items-start md:items-end">
          <div className="space-y-2 text-[15px] md:text-right">
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
              Mesafeli Satış Sözleşmesi
            </Link>
          </div>

          <div className="mt-6">
            <Image
              src="https://res.cloudinary.com/dlahfchej/image/upload/v1755085903/logo_band_colored_2x_vraqrx.png"
              alt="Ödeme Yöntemleri"
              width={260}
              height={50}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
