"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type BrandItem = {
  id: string;
  title: string;
  href: string;
  image: string;
};

type BrandShowcaseProps = {
  title: string;
  items: BrandItem[];
};

export default function BrandShowcase({ title, items }: BrandShowcaseProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollPrev(scrollLeft > 0);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: "smooth" });
      setTimeout(checkScroll, 300);
    }
  };

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: "smooth" });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section className="w-full bg-white py-12 md:py-16">
      <div className="w-full">
        
        <div className="flex items-center justify-between mb-8 px-4 md:px-8">
          <h2 className="text-xl md:text-2xl font-light text-[#111] uppercase tracking-wide">
            {title}
          </h2>
          <Link
            href={`/${title.toLowerCase().includes("women") ? "women" : "men"}/brands`}
            className="text-xs md:text-sm text-[#111] font-light uppercase tracking-wide hover:underline flex items-center gap-1"
          >
            EXPLORE A-Z
            <span className="text-[10px]">▼</span>
          </Link>
        </div>

        
        <div className="relative w-full overflow-hidden">
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-0 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            style={{ scrollBehavior: "smooth" }}
          >
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex-shrink-0 w-full md:w-1/3 group"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
              </Link>
            ))}
          </div>

          
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 md:p-3 shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 z-10"
            aria-label="Önceki"
          >
            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6 text-[#111]" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 md:p-3 shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 z-10"
            aria-label="Sonraki"
          >
            <ChevronRight className="w-4 h-4 md:w-6 md:h-6 text-[#111]" />
          </button>
        </div>
      </div>
    </section>
  );
}
