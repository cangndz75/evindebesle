"use client";

import Image from "next/image";
import Link from "next/link";

export default function WomensEveryday() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Sol - İçerik */}
          <div className="space-y-6 order-2 md:order-1">
            <p className="text-sm md:text-base text-gray-600 font-light uppercase tracking-wider">
              Her Durum İçin Temel Parçalar
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-black leading-tight">
              Women's Everyday
            </h2>
            <Link
              href="/women/everyday"
              className="inline-block px-8 py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-all duration-300 text-sm md:text-base uppercase mt-4"
            >
              Şimdi Alışveriş Yap
            </Link>
          </div>

          {/* Sağ - Görsel */}
          <div className="relative h-[500px] md:h-[600px] overflow-hidden group order-1 md:order-2">
            <Image
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop"
              alt="Women's Everyday"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
