"use client";

import Image from "next/image";

export default function ModernHero() {
  return (
    <section className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden bg-[#f5f1eb]">
      {/* Arka Plan Görseli */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=2070&auto=format&fit=crop"
          alt="Hero"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#f5f1eb]/80 via-[#f5f1eb]/60 to-transparent" />
      </div>

      {/* İçerik */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="max-w-2xl">
            {/* Üst Metin */}
            <p className="text-base md:text-lg text-gray-800 font-light mb-4">
              Gardırobunuzu Yenileyin, Yılınızı Yeniden Tanımlayın
            </p>

            {/* Ana Başlık */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light text-black mb-10 leading-[0.9]">
              A Modern Reset
            </h1>

            {/* CTA Butonları */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-10 py-4 bg-black text-white font-light tracking-wider hover:bg-gray-800 transition-all duration-300 text-sm md:text-base uppercase border-2 border-black">
                ERKEK
              </button>
              <button className="px-10 py-4 bg-black text-white font-light tracking-wider hover:bg-gray-800 transition-all duration-300 text-sm md:text-base uppercase border-2 border-black">
                KADIN
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
