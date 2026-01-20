"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Product } from "@/lib/homeData";

interface ProductCarouselProps {
  title: string;
  products: Product[];
  viewAllLink?: string;
}

export default function ProductCarousel({ title, products, viewAllLink }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollPrev(scrollLeft > 0);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
      setTimeout(checkScroll, 300);
    }
  };

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
      setTimeout(checkScroll, 300);
    }
  };


  return (
    <section className="w-full bg-white py-12 md:py-20">
      <div className="w-full px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-light text-[#111]">
            {title}
          </h2>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="text-sm font-light text-[#111] hover:opacity-70 transition-opacity uppercase tracking-wide hidden sm:inline-block"
            >
              Tümünü Gör
            </Link>
          )}
        </div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
              style={{ scrollBehavior: "smooth" }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-64 md:w-72 snap-start group"
                >
                  <Link href={`/product/${product.id}`} className="block">
                    <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-200">
                      {product.hoverImage ? (
                        <>
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
                            sizes="(max-width: 768px) 256px, 288px"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop";
                            }}
                          />
                          <Image
                            src={product.hoverImage}
                            alt={product.title}
                            fill
                            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 absolute inset-0"
                            sizes="(max-width: 768px) 256px, 288px"
                            onError={(e) => {
                              e.currentTarget.src = product.image;
                            }}
                          />
                        </>
                      ) : (
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 256px, 288px"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop";
                          }}
                        />
                      )}
                      {product.badge && (
                        <div
                          className={`absolute top-3 ${
                            product.badge === "İndirim" ? "left-3" : "right-3"
                          } px-3 py-1 bg-white text-[#111] text-xs font-light uppercase`}
                        >
                          {product.badge}
                        </div>
                      )}
                      <button
                        className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-[#111] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2"
                        aria-label="Hızlı Ekle"
                        onClick={(e) => {
                          e.preventDefault();
                          // Quick add logic
                        }}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <h3 className="text-sm font-light text-[#111] mb-1">
                      {product.title}
                    </h3>
                    <p className="text-sm font-light text-[#111] mb-2">
                      {product.price} ₺
                    </p>
                    {product.colors && product.colors.length > 0 && (
                      <div className="flex gap-1.5">
                        {product.colors.slice(0, 4).map((color, idx) => (
                          <div
                            key={idx}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color }}
                            aria-label={`Renk seçeneği ${idx + 1}`}
                          />
                        ))}
                        {product.colors.length > 4 && (
                          <span className="text-xs text-[#111]/60 font-light">
                            +{product.colors.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 bg-white border border-gray-300 p-2 md:p-3 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 shadow-lg z-10"
            aria-label="Önceki"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 bg-white border border-gray-300 p-2 md:p-3 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 shadow-lg z-10"
            aria-label="Sonraki"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
