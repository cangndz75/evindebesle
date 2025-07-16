export default function ContactInfo() {
  return (
    <div className="space-y-8 text-[15px] text-neutral-700">
      <div>
        <h2 className="text-3xl font-bold text-black mb-2">İletişim Bilgileri</h2>
        <p className="text-gray-500 leading-relaxed max-w-md">
          Evindebesle olarak, evcil dostlarınıza en iyi hizmeti sunmak için buradayız. Herhangi bir sorunuz, öneriniz veya hizmetlerimiz hakkında bilgi almak için bizimle iletişime geçebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-2">
          <h4 className="font-semibold text-black">Telefon</h4>
          <p className="text-sm text-neutral-700">+90 530 123 45 67</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-black">Adres</h4>
          <p className="text-sm text-neutral-700">
                Uptwins Blok, Orta, Yalnız Selvi Cd. No : 5AB, 34880 Kartal/İstanbul
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-black">Resmi E-posta</h4>
          <p className="text-sm text-neutral-700">evindebesle34@gmail.com</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-black">Bizi Takip Edin</h4>
          <div className="flex gap-2">
            <a
              href="#"
              className="w-9 h-9 border rounded flex items-center justify-center hover:bg-primary hover:text-white transition"
            >
              <i className="fab fa-facebook-f text-sm" />
            </a>
            <a
              href="#"
              className="w-9 h-9 border rounded flex items-center justify-center hover:bg-primary hover:text-white transition"
            >
              <i className="fab fa-twitter text-sm" />
            </a>
            <a
              href="#"
              className="w-9 h-9 border rounded flex items-center justify-center hover:bg-primary hover:text-white transition"
            >
              <i className="fab fa-pinterest-p text-sm" />
            </a>
            <a
              href="#"
              className="w-9 h-9 border rounded flex items-center justify-center hover:bg-primary hover:text-white transition"
            >
              <i className="fab fa-linkedin-in text-sm" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
