"use client";

import Image from "next/image";
import Link from "next/link";

export default function EditorialBanner() {
  return (
    <section className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden bg-white">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=2000&auto=format&fit=crop"
          alt="İyi Seyahat"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
          unoptimized
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="w-full px-4 md:px-6">
          <div className="max-w-2xl">
            {/* Main Headline */}
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif font-light text-white leading-tight mb-6">
              <span className="block">İyi Seyahat</span>
              <span className="block">AirEssentials ile</span>
            </h2>

            {/* Sub-text */}
            <p className="text-base md:text-lg text-white/90 font-light mb-8 leading-relaxed">
              Uçuş? Rezerve edildi. Konfor ve stil? Kolay. Paketle, check-in yap, gez—hepsini AirEssentials ile yap.
            </p>

            {/* CTA Button */}
            <Link
              href="/collections/loungewear"
              className="inline-block px-8 py-4 border-2 border-[#8B4513] text-white text-sm md:text-base font-light tracking-wider uppercase hover:bg-[#8B4513] hover:border-[#8B4513] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              LOUNGE GİYİM ALIŞVERİŞİ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
