"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
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
                    </div>
                    <h3 className="text-sm font-light text-[#111] mb-1 uppercase pl-2 md:pl-4">
                      {product.title}
                    </h3>
                    <p className="text-base font-light text-[#111] mb-1 pl-2 md:pl-4">
                      {product.price.toFixed(2)} ₺
                    </p>
                    {product.colors && product.colors.length > 0 && (
                      <>
                        <p className="text-xs text-[#111]/60 font-light mb-2 pl-2 md:pl-4">
                          {product.colors.length} renk seçeneği
                        </p>
                        <div className="flex gap-1.5 pl-2 md:pl-4">
                          {product.colors.slice(0, 4).map((color, idx) => {
                            const colorValue = typeof color === 'string' ? color : color.value;
                            return (
                              <div
                                key={idx}
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: colorValue }}
                                aria-label={`Renk seçeneği ${idx + 1}`}
                              />
                            );
                          })}
                          {product.colors.length > 4 && (
                            <span className="text-xs text-[#111]/60 font-light">
                              +{product.colors.length - 4}
                            </span>
                          )}
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
                                        const result = await res.json();
                                        
                                        // Giriş yapmamış kullanıcı için localStorage'a kaydet
                                        if (!result.userId && result.product) {
                                          const { addToGuestCart } = await import("@/lib/cart-utils");
                                          addToGuestCart(
                                            product.id,
                                            currentColorId || null,
                                            sizeId || null,
                                            1,
                                            {
                                              id: result.product.id,
                                              name: result.product.name || product.title,
                                              image: result.product.image || product.image,
                                              price: result.product.price || product.price || 0,
                                            },
                                            result.color || null,
                                            result.size || null
                                          );
                                        }
                                        
                                        window.dispatchEvent(new Event("cartUpdated"));
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
