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
  id: number;
  title: string;
  href: string;
  image: string;
  hoverImage: string;
  color: string;
  colors: ColorOption[];
};

const products: Product[] = [
  {
    id: 1,
    title: "Long Sleeve Crew",
    href: "/product/1",
    image: "https://cdn.shopify.com/s/files/1/1464/5034/files/ShortSleeves.jpg?v=1768323001&quality=75&width=600&height=750&crop=center",
    hoverImage: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    color: "Navy",
    colors: [
      {
        name: "Black",
        value: "#000000",
        image: "https://cdn.shopify.com/s/files/1/1464/5034/files/ShortSleeves.jpg?v=1768323001&quality=75&width=600&height=750&crop=center",
      },
      {
        name: "Brown",
        value: "#8B4513",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Purple",
        value: "#4B0082",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      },
    ],
  },
  {
    id: 2,
    title: "Short Sleeve Tee",
    href: "/product/2",
    image: "https://cdn.shopify.com/s/files/1/1464/5034/files/ShortSleeves.jpg?v=1768323001&quality=75&width=600&height=750&crop=center",
    hoverImage: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    color: "Light Grey",
    colors: [
      {
        name: "Black",
        value: "#000000",
        image: "https://cdn.shopify.com/s/files/1/1464/5034/files/ShortSleeves.jpg?v=1768323001&quality=75&width=600&height=750&crop=center",
      },
      {
        name: "Brown",
        value: "#8B4513",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Purple",
        value: "#4B0082",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      },
    ],
  },
  {
    id: 3,
    title: "Pants Set",
    href: "/product/3",
    image: "https://cdn.shopify.com/s/files/1/1464/5034/files/ShortSleeves.jpg?v=1768323001&quality=75&width=600&height=750&crop=center",
    hoverImage: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    color: "Navy & Light",
    colors: [
      {
        name: "Black",
        value: "#000000",
        image: "https://cdn.shopify.com/s/files/1/1464/5034/files/ShortSleeves.jpg?v=1768323001&quality=75&width=600&height=750&crop=center",
      },
      {
        name: "Brown",
        value: "#8B4513",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Purple",
        value: "#4B0082",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      },
    ],
  },
  {
    id: 4,
    title: "Short Sleeve Crew",
    href: "/product/4",
    image: "https://cdn.shopify.com/s/files/1/1464/5034/files/ShortSleeves.jpg?v=1768323001&quality=75&width=600&height=750&crop=center",
    hoverImage: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    color: "Navy",
    colors: [
      {
        name: "Black",
        value: "#000000",
        image: "https://cdn.shopify.com/s/files/1/1464/5034/files/ShortSleeves.jpg?v=1768323001&quality=75&width=600&height=750&crop=center",
      },
      {
        name: "Brown",
        value: "#8B4513",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Purple",
        value: "#4B0082",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      },
    ],
  },
];

export default function ProductShowcase() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredColor, setHoveredColor] = useState<{ productId: number; colorImage: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ productId: number; colorImage: string } | null>(null);
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

  const handleColorInteraction = (productId: number, colorImage: string) => {
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
                  href={product.href}
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
                    {!isColorActive && (
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
                
                {/* Color Options */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  {product.colors.map((color, idx) => {
                    const isActive = (hoveredColor?.productId === product.id && hoveredColor.colorImage === color.image) ||
                                     (selectedColor?.productId === product.id && selectedColor.colorImage === color.image);
                    return (
                      <button
                        key={idx}
                        onMouseEnter={() => setHoveredColor({ productId: product.id, colorImage: color.image })}
                        onMouseLeave={handleColorLeave}
                        onClick={() => handleColorInteraction(product.id, color.image)}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 ${
                          isActive ? "border-[#111] scale-110" : "border-white"
                        }`}
                        style={{ backgroundColor: color.value }}
                        aria-label={`${color.name} renk seçeneği`}
                      />
                    );
                  })}
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
                    href={product.href}
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
                      {!isColorActive && (
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
                  
                  {/* Color Options */}
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {product.colors.map((color, idx) => {
                      const isActive = (hoveredColor?.productId === product.id && hoveredColor.colorImage === color.image) ||
                                       (selectedColor?.productId === product.id && selectedColor.colorImage === color.image);
                      return (
                        <button
                          key={idx}
                          onMouseEnter={() => setHoveredColor({ productId: product.id, colorImage: color.image })}
                          onMouseLeave={handleColorLeave}
                          onClick={() => handleColorInteraction(product.id, color.image)}
                          className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 ${
                            isActive ? "border-[#111] scale-110" : "border-white"
                          }`}
                          style={{ backgroundColor: color.value }}
                          aria-label={`${color.name} renk seçeneği`}
                        />
                      );
                    })}
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
        
        {/* Show More Button */}
        <div className="mt-12 md:mt-16 flex justify-center">
          <Link
            href="/products"
            className="px-8 py-3 border border-[#111] bg-white text-[#111] text-sm md:text-base font-light hover:bg-[#111] hover:text-white transition-all duration-300"
          >
            Daha Fazla Göster
          </Link>
        </div>
      </div>
    </section>
  );
}
