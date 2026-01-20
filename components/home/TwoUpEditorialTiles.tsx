"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRef, useEffect, useState } from "react";

type Tile = {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  align?: "left" | "right";
};

const tiles: Tile[] = [
  {
    title: "Drop-Cut: LUX",
    subtitle: "Her Zaman Hazır, Her Zaman Yükseltilmiş Temel Parça",
    href: "/collections/drop-cut-lux",
    image:
      "https://images.unsplash.com/photo-1520975958225-1a2f49f6dcd1?q=80&w=2200&auto=format&fit=crop",
    align: "left",
  },
  {
    title: "Balm Koleksiyonu",
    subtitle: "Yükseltilmiş Silüetler, Yumuşak Esneklik",
    href: "/collections/balm",
    image:
      "https://images.unsplash.com/photo-1520975682071-a19c07a7f04c?q=80&w=2200&auto=format&fit=crop",
    align: "right",
  },
];

export default function TwoUpEditorialTiles() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <section className="w-full bg-white">
      <div className="w-full px-2 md:px-6 py-10 md:py-14">
        {/* Desktop: Grid */}
        <div className="hidden md:grid grid-cols-2 gap-6">
          {tiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group block"
              aria-label={t.title}
            >
              {/* Image */}
              <div className="relative w-full overflow-hidden bg-[#f4f2ee]">
                {/* SS'teki gibi yüksek dikey kutu hissi */}
                <div className="relative h-[520px] sm:h-[620px] lg:h-[720px]">
                  <Image
                    src={t.image}
                    alt={t.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                    unoptimized
                    priority={false}
                  />
                  {/* çok hafif vignette */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
              </div>

              {/* Caption strip (SS'teki gibi altta beyaz alan) */}
              <div className="bg-white pt-4 pb-6">
                <div className="flex items-center gap-3">
                  <div className="text-[18px] md:text-[20px] font-medium tracking-tight text-black">
                    {t.title}
                  </div>
                  <ArrowRight className="h-5 w-5 text-black transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
                <div className="mt-2 text-[13px] md:text-[14px] text-black/70">
                  {t.subtitle}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile: Carousel - 1 tam görünsün, diğeri ufaktan */}
        <div className="md:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory" ref={scrollContainerRef}>
          <div className="flex gap-2 px-2">
            {tiles.map((t, index) => (
              <Link
                key={t.href}
                href={t.href}
                className="group block flex-shrink-0 snap-start"
                style={{ width: "calc(100vw - 16px)" }}
                aria-label={t.title}
              >
                {/* Image */}
                <div className="relative w-full overflow-hidden bg-[#f4f2ee]">
                  <div className="relative h-[520px]">
                    <Image
                      src={t.image}
                      alt={t.title}
                      fill
                      sizes="(max-width: 768px) 85vw, 50vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                      unoptimized
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  </div>
                </div>

                {/* Caption strip */}
                <div className="bg-white pt-4 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="text-[18px] font-medium tracking-tight text-black">
                      {t.title}
                    </div>
                    <ArrowRight className="h-5 w-5 text-black transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-2 text-[13px] text-black/70">
                    {t.subtitle}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
