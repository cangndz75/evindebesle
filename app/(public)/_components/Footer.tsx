import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#f3f1ee] text-[#3a2f29] px-6 md:px-24 py-14 text-sm font-light tracking-wide">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-20">
        {/* Logo + Copyright */}
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-6">evindebesle</h1>
          </div>
          <p className="text-xs text-[#6b6059]">© EvindeBesle 2025. Tüm hakları saklıdır.</p>
        </div>

        {/* Address */}
        <div className="leading-7 text-[15px]">
          <p className="font-medium">evindebesle</p>
          <p>Uptwins Blok, Orta, Yalnız Selvi Cd. No : 5AB, 34880 Kartal/İstanbul</p>
          <p className="mt-2">
            M. <a href="mailto:info@evindebesle.com" className="underline">info@evindebesle.com</a>
          </p>
          <p>
            W. <a href="https://evindebesle.com" className="underline">evindebesle.com</a>
          </p>
        </div>

        {/* Policies */}
        <div className="space-y-2 text-[15px]">
          <Link href="#" className="block hover:underline">Şartlar ve Koşullar</Link>
          <Link href="#" className="block hover:underline">Gizlilik Politikası</Link>
          {/* <Link href="#" className="block hover:underline">Cookie policy</Link> */}
          <div className="mt-6 text-xs text-[#6b6059] flex items-center">
            Webdesign by DogoPet
            {/* <img
              src="/third-dimension-logo.png"
              alt="DogoPet"
              className="h-4 ml-2 opacity-70"
            /> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
