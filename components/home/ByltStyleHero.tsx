"use client";

import Image from "next/image";
import Link from "next/link";

export default function DarkVelvetHero() {

  return (
    <section className="relative w-full h-[70vh] md:h-[92vh] overflow-hidden bg-white">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1280&auto=format&fit=crop"
          alt="Dark Velvet Hero"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Gradient overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/40" />
      </div>

      <div className="relative z-10 h-full flex items-center justify-center text-center">
        <div className="w-full max-w-5xl mx-auto pt-12 md:pt-16 px-4 md:px-10">
          <p className="text-white/90 text-xs md:text-sm tracking-[0.22em] uppercase mb-4 md:mb-6">
            Gardırobunu yenile, konforu yeniden tanımla
          </p>

          <h1 className="text-white font-serif font-light leading-[0.9] text-[3rem] md:text-[4.2rem] lg:text-[6rem] xl:text-[7.5rem] mb-6 md:mb-10">
            <span className="block">Modern Bir</span>
            <span className="block">Yenilenme</span>
          </h1>

          <div className="flex flex-row items-center justify-center gap-3 md:gap-4">
            <Link
              href="/category/men"
              className="w-full max-w-[200px] md:w-auto px-8 md:px-12 py-3 md:py-4 border-2 border-white text-white text-xs md:text-sm tracking-[0.22em] uppercase hover:bg-white hover:text-black transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              ERKEK
            </Link>
            <Link
              href="/category/women"
              className="w-full max-w-[200px] md:w-auto px-8 md:px-12 py-3 md:py-4 border-2 border-white text-white text-xs md:text-sm tracking-[0.22em] uppercase hover:bg-white hover:text-black transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              KADIN
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
