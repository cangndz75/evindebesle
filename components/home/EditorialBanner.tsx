"use client";

import Image from "next/image";
import Link from "next/link";

export default function EditorialBanner() {
  return (
    <section className="relative w-full h-150 md:h-175 lg:h-200 overflow-hidden bg-white">
      
      <div className="absolute inset-0">
        <Image
          src="https://res.cloudinary.com/dlahfchej/image/upload/v1771709414/banner1_ntdz9i.png"
          alt="Dark Velvet"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        
        <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/40 to-transparent" />
      </div>

      
      <div className="relative z-10 h-full flex items-center">
        <div className="w-full px-4 md:px-6">
          <div className="max-w-2xl">
            
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif font-light text-white leading-tight mb-6">
              <span className="block">Modern</span>
              <span className="block">Konfor</span>
            </h2>

            
            <p className="text-base md:text-lg text-white/90 font-light mb-8 leading-relaxed">
              Günlük yaşamınızda şıklığı ve rahatlığı bir araya getirin. Dark Velvet ile her anınızda kendinizi özel hissedin.
            </p>

            
            <Link
              href="/collections"
              className="inline-block px-8 py-4 border-2 border-white text-white text-sm md:text-base font-light tracking-wider uppercase hover:bg-white hover:text-black transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              KOLEKSİYONU KEŞFET
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
