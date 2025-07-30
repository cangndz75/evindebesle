export default function ContactInfo() {
  return (
    <div className="space-y-8 text-[15px] text-neutral-700">
      <div>
        <h2 className="text-3xl font-bold text-black mb-2">
          İletişim Bilgileri
        </h2>
        <p className="text-gray-500 leading-relaxed max-w-md">
          Evindebesle olarak, evcil dostlarınıza en iyi hizmeti sunmak için
          buradayız. Herhangi bir sorunuz, öneriniz veya hizmetlerimiz hakkında
          bilgi almak için bizimle iletişime geçebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-2">
          <h4 className="font-semibold text-black">Ticaret Unvanı</h4>
          <p className="text-sm">Dogo Petshop LTD. ŞTİ.</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-black">MERSİS No</h4>
          <p className="text-sm">0302111904500001</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-black">Vergi Bilgileri</h4>
          <p className="text-sm">Yakacık Vergi Dairesi | VKN: 3021119045</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-black">İTO Bilgisi</h4>
          <p className="text-sm">İstanbul Ticaret Odası’na kayıtlıdır.</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-black">Telefon</h4>
          <p className="text-sm">+90 216 519 26 00</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-black">Adres</h4>
          <p className="text-sm">
            Uptwins Blok, Orta, Yalnız Selvi Cd. No : 5AB, 34880 Kartal/İstanbul
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-black">Kurumsal E-posta</h4>
          <p className="text-sm">
            <a href="mailto:info@evindebesle.com" className="underline">
              info@evindebesle.com
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-black">Web Sitesi</h4>
          <p className="text-sm">
            <a href="https://evindebesle.com" className="underline">
              evindebesle.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
