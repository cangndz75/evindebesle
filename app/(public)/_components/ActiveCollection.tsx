"use client";

import Image from "next/image";
import Link from "next/link";

export default function ActiveCollection() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Sol - Görsel */}
          <div className="relative h-[500px] md:h-[600px] overflow-hidden group">
            <Image
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop"
              alt="Active Collection"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Sağ - İçerik */}
          <div className="space-y-6">
            <p className="text-sm md:text-base text-gray-600 font-light uppercase tracking-wider">
              Her Rutin İçin Tasarlanmış
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-black leading-tight">
              The Active Collection
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/men/active"
                className="px-8 py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-all duration-300 text-sm md:text-base uppercase text-center"
              >
                ERKEK
              </Link>
              <Link
                href="/women/active"
                className="px-8 py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-all duration-300 text-sm md:text-base uppercase text-center"
              >
                KADIN
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
