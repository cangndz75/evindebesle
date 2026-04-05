"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function CollectionBanner() {
  return (
    <section className="w-full bg-[#f5f1eb] py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          
          <div className="md:col-span-2 relative h-[500px] md:h-[600px] overflow-hidden group">
            <Image
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop"
              alt="Active Collection"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 66vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8">
              <p className="text-white/90 text-sm md:text-base font-light mb-2">
                Her Rutin İçin Tasarlanmış
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl text-white font-light mb-4">
                Aktif Koleksiyon
              </h2>
            </div>
          </div>

          
          <div className="relative h-[500px] md:h-[600px] overflow-hidden group border-4 border-white">
            <Image
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop"
              alt="Modern Reset"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <h2 className="text-4xl md:text-5xl lg:text-6xl text-white font-light mb-2">
                MODERN
              </h2>
              <h2 className="text-4xl md:text-5xl lg:text-6xl text-white font-light mb-4">
                RESET
              </h2>
              <p className="text-white/80 text-xs md:text-sm font-light mb-2">
                DROP 1
              </p>
              <p className="text-white/70 text-xs font-light">
                DARK VELVET TARAFINDAN SUNULDU
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
