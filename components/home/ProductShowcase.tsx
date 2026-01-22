"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ColorOption = {
  name: string;
  value: string;
  image: string;
};

type Product = {
  id: string;
  title: string;
  price?: number;
  image: string;
  hoverImage?: string;
  colors: ColorOption[];
};

interface ProductShowcaseProps {
  products: Product[];
}

export default function ProductShowcase({ products = [] }: ProductShowcaseProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredColor, setHoveredColor] = useState<{ productId: string; colorImage: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ productId: string; colorImage: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollPrev(scrollLeft > 0);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: "smooth" });
      setTimeout(checkScroll, 300);
    }
  };

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: "smooth" });
      setTimeout(checkScroll, 300);
    }
  };

  const handleColorInteraction = (productId: string, colorImage: string) => {
    setHoveredColor({ productId, colorImage });
    setSelectedColor({ productId, colorImage });
  };

  const handleColorLeave = () => {
    setHoveredColor(null);
    // Mobilde seçili rengi koru, desktop'ta sıfırla
    if (!isMobile) {
      setSelectedColor(null);
    }
  };

  return (
    <section className="w-full bg-white py-12 md:py-20">
      <div className="w-full">
        {/* Desktop: Grid */}
        <div className="hidden md:grid grid-cols-4 gap-6">
          {products.map((product) => {
            const isColorActive = (hoveredColor?.productId === product.id || selectedColor?.productId === product.id);
            const activeColorImage = hoveredColor?.productId === product.id 
              ? hoveredColor.colorImage 
              : selectedColor?.productId === product.id
              ? selectedColor.colorImage
              : null;
            
            const currentImage = activeColorImage || product.image;
            
            return (
              <div key={product.id} className="group">
                <Link
                  href={`/product/${product.id}`}
                  className="relative overflow-hidden block"
                >
                  <div className="relative aspect-[3/4] bg-white">
                    {/* Main Image */}
                    <Image
                      src={currentImage}
                      alt={product.title}
                      fill
                      className="object-cover object-center transition-opacity duration-500"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      unoptimized
                    />
                    {/* Hover Image (when no color is active and product is hovered) */}
                    {!isColorActive && product.hoverImage && (
                      <Image
                        src={product.hoverImage}
                        alt={`${product.title} hover`}
                        fill
                        className="object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        unoptimized
                      />
                    )}
                    </div>
                  </Link>
                  
                  {/* Product Info */}
                  <div className="mt-4">
                    <h3 className="text-sm font-light text-[#111] mb-1 uppercase">
                      {product.title}
                    </h3>
                    {product.colors && product.colors.length > 0 && (
                      <>
                        <p className="text-xs text-[#111]/60 font-light mb-2">
                          {product.colors.length} renk seçeneği
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          {product.colors.map((color, idx) => {
                            const isActive = (hoveredColor?.productId === product.id && hoveredColor.colorImage === color.image) ||
                                             (selectedColor?.productId === product.id && selectedColor.colorImage === color.image);
                            return (
                              <button
                                key={idx}
                                onMouseEnter={() => setHoveredColor({ productId: product.id, colorImage: color.image })}
                                onMouseLeave={handleColorLeave}
                                onClick={() => handleColorInteraction(product.id, color.image)}
                                className={`w-4 h-4 rounded-full border border-gray-300 transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 ${
                                  isActive ? "border-[#111] scale-110" : ""
                                }`}
                                style={{ backgroundColor: color.value }}
                                aria-label={`${color.name} renk seçeneği`}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: Carousel */}
        <div className="md:hidden relative w-full overflow-hidden">
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
            style={{ scrollBehavior: "smooth" }}
          >
            {products.map((product) => {
              const isColorActive = (hoveredColor?.productId === product.id || selectedColor?.productId === product.id);
              const activeColorImage = hoveredColor?.productId === product.id 
                ? hoveredColor.colorImage 
                : selectedColor?.productId === product.id
                ? selectedColor.colorImage
                : null;
              
              const currentImage = activeColorImage || product.image;
              
              return (
                <div key={product.id} className="flex-shrink-0 w-[calc(50%-8px)] snap-start group">
                  <Link
                    href={`/product/${product.id}`}
                    className="relative overflow-hidden block"
                  >
                    <div className="relative aspect-[3/4] bg-white">
                      {/* Main Image */}
                      <Image
                        src={currentImage}
                        alt={product.title}
                        fill
                        className="object-cover object-center transition-opacity duration-500"
                        sizes="50vw"
                        unoptimized
                      />
                      {/* Hover Image (when no color is active and product is hovered) */}
                      {!isColorActive && product.hoverImage && (
                        <Image
                          src={product.hoverImage}
                          alt={`${product.title} hover`}
                          fill
                          className="object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                          sizes="50vw"
                          unoptimized
                        />
                      )}
                    </div>
                  </Link>
                  
                  {/* Product Info */}
                  <div className="mt-4">
                    <h3 className="text-sm font-light text-[#111] mb-1 uppercase">
                      {product.title}
                    </h3>
                    {product.price && (
                      <p className="text-base font-light text-[#111] mb-1">
                        {product.price.toFixed(2)} ₺
                      </p>
                    )}
                    {product.colors && product.colors.length > 0 && (
                      <>
                        <p className="text-xs text-[#111]/60 font-light mb-2">
                          {product.colors.length} renk seçeneği
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          {product.colors.map((color, idx) => {
                            const isActive = (hoveredColor?.productId === product.id && hoveredColor.colorImage === color.image) ||
                                             (selectedColor?.productId === product.id && selectedColor.colorImage === color.image);
                            return (
                              <button
                                key={idx}
                                onMouseEnter={() => setHoveredColor({ productId: product.id, colorImage: color.image })}
                                onMouseLeave={handleColorLeave}
                                onClick={() => handleColorInteraction(product.id, color.image)}
                                className={`w-4 h-4 rounded-full border border-gray-300 transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 ${
                                  isActive ? "border-[#111] scale-110" : ""
                                }`}
                                style={{ backgroundColor: color.value }}
                                aria-label={`${color.name} renk seçeneği`}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white border border-gray-300 p-2 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 shadow-lg z-10"
            aria-label="Önceki"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white border border-gray-300 p-2 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 shadow-lg z-10"
            aria-label="Sonraki"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Show More Button - Sadece ürün varsa göster */}
        {products.length > 0 && (
          <div className="mt-12 md:mt-16 flex justify-center">
            <Link
              href="/products"
              className="px-8 py-3 border border-[#111] bg-white text-[#111] text-sm md:text-base font-light hover:bg-[#111] hover:text-white transition-all duration-300"
            >
              Daha Fazla Göster
            </Link>
          </div>
        )}
        
        {/* Ürün yoksa boş durum */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#111]/60 font-light">Henüz ürün bulunmuyor.</p>
          </div>
        )}
      </div>
    </section>
  );
}
