"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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
  sizes?: Array<{ name: string; stock: number; id?: string }>;
  sizeOptions?: Array<{ name: string; id?: string }>;
  colorId?: string;
  variants?: Array<{ colorId: string | null; sizeId: string | null; stock: number }>;
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

  useEffect(() => {
    checkScroll();
  }, [products]);

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
      <div className="w-full px-4 md:px-6">
        {/* Desktop: Carousel */}
        <div className="hidden md:block relative">
          <div className="overflow-hidden">
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
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
                  <div key={product.id} className="flex-shrink-0 w-64 md:w-72 snap-start group">
                    <Link
                      href={`/product/${product.id}`}
                      className="relative overflow-hidden block"
                    >
                      <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-200">
                        {!isColorActive && product.hoverImage ? (
                          <>
                            <Image
                              src={currentImage}
                              alt={product.title}
                              fill
                              className="object-cover transition-opacity duration-500 group-hover:opacity-0"
                              sizes="(max-width: 768px) 256px, 288px"
                              loading="lazy"
                              quality={85}
                              placeholder="blur"
                              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                            />
                            <Image
                              src={product.hoverImage}
                              alt={`${product.title} hover`}
                              fill
                              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 absolute inset-0"
                              sizes="(max-width: 768px) 256px, 288px"
                              loading="lazy"
                              quality={85}
                            />
                          </>
                        ) : (
                          <Image
                            src={currentImage}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 256px, 288px"
                            loading="lazy"
                            quality={85}
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          />
                        )}
                      </div>
                    </Link>
                  
                    {/* Product Info */}
                    <h3 className="text-sm font-light text-[#111] mb-1 uppercase pl-2 md:pl-4">
                      {product.title}
                    </h3>
                    {product.price && (
                      <p className="text-base font-light text-[#111] mb-1 pl-2 md:pl-4">
                        {product.price.toFixed(2)} ₺
                      </p>
                    )}
                    {product.colors && product.colors.length > 0 && (
                      <>
                        <p className="text-xs text-[#111]/60 font-light mb-2 pl-2 md:pl-4">
                          {product.colors.length} renk seçeneği
                        </p>
                        <div className="flex items-center gap-1.5 mb-3 pl-2 md:pl-4">
                          {product.colors.map((color, idx) => {
                            const isActive = (hoveredColor?.productId === product.id && hoveredColor.colorImage === color.image) ||
                                             (selectedColor?.productId === product.id && selectedColor.colorImage === color.image);
                            return (
                              <button
                                key={idx}
                                onMouseEnter={() => setHoveredColor({ productId: product.id, colorImage: color.image })}
                                onMouseLeave={handleColorLeave}
                                onClick={() => handleColorInteraction(product.id, color.image)}
                                className={`w-4 h-4 rounded-full border transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 ${
                                  isActive ? "border-[#111] scale-110" : "border-gray-300"
                                }`}
                                style={{ backgroundColor: color.value }}
                                aria-label={`${color.name} renk seçeneği`}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Hızlı Ekle Bölümü - Her zaman görünür */}
                    <div className="mt-2 pl-2 md:pl-4">
                      <div className="border border-gray-200 rounded-sm p-4 bg-white">
                        <p className="text-xs font-light text-[#111] mb-3 text-center">Hızlı ekle</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {(() => {
                            const availableSizes = product.sizes && product.sizes.length > 0
                              ? product.sizes
                              : product.sizeOptions && product.sizeOptions.length > 0
                              ? product.sizeOptions.map(so => ({ name: so.name, stock: 0, id: so.id }))
                              : [];
                            
                            if (availableSizes.length === 0) {
                              return (
                                <p className="text-xs text-gray-500">Beden seçeneği bulunmuyor</p>
                              );
                            }

                            const currentColorId = product.colorId;
                            
                            return availableSizes.map((size, sizeIdx) => {
                              const sizeName = typeof size === 'string' ? size : size.name;
                              const sizeStock = typeof size === 'object' ? size.stock : 0;
                              const sizeId = typeof size === 'object' && size.id ? size.id : null;
                              
                              let variantStock = 0;
                              if (currentColorId && product.variants) {
                                const variant = product.variants.find((v: any) => 
                                  v.colorId === currentColorId && v.sizeId === sizeId
                                );
                                variantStock = variant?.stock || 0;
                              }
                              
                              const finalStock = variantStock > 0 ? variantStock : sizeStock;
                              const isOutOfStock = finalStock <= 0;
                              
                              return (
                                <button
                                  key={sizeIdx}
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    if (isOutOfStock) {
                                      toast.error("Bu beden stokta yok", {
                                        position: "bottom-left",
                                      });
                                      return;
                                    }

                                    try {
                                      const res = await fetch("/api/cart", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          productId: product.id,
                                          colorId: currentColorId || null,
                                          sizeId: sizeId || null,
                                          quantity: 1,
                                        }),
                                      });

                                      if (res.ok) {
                                        window.dispatchEvent(new Event("cartUpdated"));
                                        toast.success(`${product.title} (${sizeName}) sepete eklendi`, {
                                          position: "bottom-left",
                                        });
                                      } else {
                                        const error = await res.json();
                                        toast.error(error.error || "Sepete eklenirken bir hata oluştu", {
                                          position: "bottom-left",
                                        });
                                      }
                                    } catch (error) {
                                      console.error("Error adding to cart:", error);
                                      toast.error("Sepete eklenirken bir hata oluştu", {
                                        position: "bottom-left",
                                      });
                                    }
                                  }}
                                  disabled={isOutOfStock}
                                  className={`px-3 py-1.5 text-xs font-light border transition-all ${
                                    isOutOfStock
                                      ? "border-gray-200 text-gray-400 line-through cursor-not-allowed bg-white"
                                      : "border-gray-300 hover:border-[#111] hover:bg-[#111] hover:text-white bg-white text-[#111]"
                                  }`}
                                >
                                  {sizeName}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows - Desktop */}
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
                        loading="lazy"
                        quality={85}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                      />
                      {/* Hover Image (when no color is active and product is hovered) */}
                      {!isColorActive && product.hoverImage && (
                        <Image
                          src={product.hoverImage}
                          alt={`${product.title} hover`}
                          fill
                          className="object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                          sizes="50vw"
                          loading="lazy"
                          quality={85}
                        />
                      )}
                    </div>
                  </Link>
                  
                  {/* Product Info */}
                  <div className="mt-4 pl-2">
                    <h3 className="text-sm font-light text-[#111] mb-1 uppercase">
                      {product.title}
                    </h3>
                    {product.price && (
                      <p className="text-sm md:text-base font-light text-[#111] mb-1">
                        {product.price.toFixed(2)} ₺
                      </p>
                    )}
                    {product.colors && product.colors.length > 0 && (
                      <>
                        <p className="text-xs text-[#111]/60 font-light mb-2">
                          {product.colors.length} renk seçeneği
                        </p>
                        <div className="flex items-center gap-1.5 mb-3">
                          {product.colors.map((color, idx) => {
                            const isActive = (hoveredColor?.productId === product.id && hoveredColor.colorImage === color.image) ||
                                             (selectedColor?.productId === product.id && selectedColor.colorImage === color.image);
                            return (
                              <button
                                key={idx}
                                onMouseEnter={() => setHoveredColor({ productId: product.id, colorImage: color.image })}
                                onMouseLeave={handleColorLeave}
                                onClick={() => handleColorInteraction(product.id, color.image)}
                                className={`w-4 h-4 rounded-full border transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 ${
                                  isActive ? "border-[#111] scale-110" : "border-gray-300"
                                }`}
                                style={{ backgroundColor: color.value }}
                                aria-label={`${color.name} renk seçeneği`}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Hızlı Ekle Bölümü - Her zaman görünür */}
                    <div className="mb-2">
                      <div className="border border-gray-200 rounded-sm p-4 bg-white">
                        <p className="text-xs font-light text-[#111] mb-3 text-center">Hızlı ekle</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {(() => {
                            const availableSizes = product.sizes && product.sizes.length > 0
                              ? product.sizes
                              : product.sizeOptions && product.sizeOptions.length > 0
                              ? product.sizeOptions.map(so => ({ name: so.name, stock: 0, id: so.id }))
                              : [];
                            
                            if (availableSizes.length === 0) {
                              return (
                                <p className="text-xs text-gray-500">Beden seçeneği bulunmuyor</p>
                              );
                            }

                            const currentColorId = product.colorId;
                            
                            return availableSizes.map((size, sizeIdx) => {
                              const sizeName = typeof size === 'string' ? size : size.name;
                              const sizeStock = typeof size === 'object' ? size.stock : 0;
                              const sizeId = typeof size === 'object' && size.id ? size.id : null;
                              
                              let variantStock = 0;
                              if (currentColorId && product.variants) {
                                const variant = product.variants.find((v: any) => 
                                  v.colorId === currentColorId && v.sizeId === sizeId
                                );
                                variantStock = variant?.stock || 0;
                              }
                              
                              const finalStock = variantStock > 0 ? variantStock : sizeStock;
                              const isOutOfStock = finalStock <= 0;
                              
                              return (
                                <button
                                  key={sizeIdx}
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    if (isOutOfStock) {
                                      toast.error("Bu beden stokta yok", {
                                        position: "bottom-left",
                                      });
                                      return;
                                    }

                                    try {
                                      const res = await fetch("/api/cart", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          productId: product.id,
                                          colorId: currentColorId || null,
                                          sizeId: sizeId || null,
                                          quantity: 1,
                                        }),
                                      });

                                      if (res.ok) {
                                        window.dispatchEvent(new Event("cartUpdated"));
                                        toast.success(`${product.title} (${sizeName}) sepete eklendi`, {
                                          position: "bottom-left",
                                        });
                                      } else {
                                        const error = await res.json();
                                        toast.error(error.error || "Sepete eklenirken bir hata oluştu", {
                                          position: "bottom-left",
                                        });
                                      }
                                    } catch (error) {
                                      console.error("Error adding to cart:", error);
                                      toast.error("Sepete eklenirken bir hata oluştu", {
                                        position: "bottom-left",
                                      });
                                    }
                                  }}
                                  disabled={isOutOfStock}
                                  className={`px-3 py-1.5 text-xs font-light border transition-all ${
                                    isOutOfStock
                                      ? "border-gray-200 text-gray-400 line-through cursor-not-allowed bg-white"
                                      : "border-gray-300 hover:border-[#111] hover:bg-[#111] hover:text-white bg-white text-[#111]"
                                  }`}
                                >
                                  {sizeName}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
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
