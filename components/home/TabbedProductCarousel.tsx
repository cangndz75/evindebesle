"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Product } from "@/lib/homeData";

interface TabbedProductCarouselProps {
  newArrivals: Product[];
  bestSellers: Product[];
  recommended: Product[];
  viewAllLinks?: {
    newArrivals?: string;
    bestSellers?: string;
    recommended?: string;
  };
}

export default function TabbedProductCarousel({
  newArrivals,
  bestSellers,
  recommended,
  viewAllLinks,
}: TabbedProductCarouselProps) {
  const [activeTab, setActiveTab] = useState("new-arrivals");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const getCurrentProducts = () => {
    switch (activeTab) {
      case "new-arrivals":
        return newArrivals;
      case "best-sellers":
        return bestSellers;
      case "recommended":
        return recommended;
      default:
        return newArrivals;
    }
  };

  const getViewAllLink = () => {
    switch (activeTab) {
      case "new-arrivals":
        return viewAllLinks?.newArrivals;
      case "best-sellers":
        return viewAllLinks?.bestSellers;
      case "recommended":
        return viewAllLinks?.recommended;
      default:
        return viewAllLinks?.newArrivals;
    }
  };

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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Scroll'u sıfırla
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
      setTimeout(checkScroll, 100);
    }
  };

  return (
    <section className="w-full bg-white py-12 md:py-20">
      <div className="w-full px-4 md:px-6">
        <Tabs
          defaultValue="new-arrivals"
          className="w-full"
          onValueChange={handleTabChange}
        >
          <div className="flex items-center justify-between mb-8">
            <TabsList className="bg-transparent border-b border-gray-200 rounded-none h-auto p-0">
              <TabsTrigger
                value="new-arrivals"
                className="px-6 py-3 text-sm font-light uppercase tracking-wide data-[state=active]:border-b-2 data-[state=active]:border-[#111] data-[state=active]:bg-transparent rounded-none data-[state=active]:text-[#111] text-gray-500"
              >
                New Arrivals
              </TabsTrigger>
              <TabsTrigger
                value="best-sellers"
                className="px-6 py-3 text-sm font-light uppercase tracking-wide data-[state=active]:border-b-2 data-[state=active]:border-[#111] data-[state=active]:bg-transparent rounded-none data-[state=active]:text-[#111] text-gray-500"
              >
                Best Sellers
              </TabsTrigger>
              <TabsTrigger
                value="recommended"
                className="px-6 py-3 text-sm font-light uppercase tracking-wide data-[state=active]:border-b-2 data-[state=active]:border-[#111] data-[state=active]:bg-transparent rounded-none data-[state=active]:text-[#111] text-gray-500"
              >
                Recommended
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-4">
              {getViewAllLink() && (
                <Link
                  href={getViewAllLink()!}
                  className="text-sm font-light text-[#111] hover:opacity-70 transition-opacity uppercase tracking-wide hidden sm:inline-block"
                >
                  VIEW ALL
                </Link>
              )}
              <div className="flex gap-2">
                <button
                  onClick={scrollPrev}
                  disabled={!canScrollPrev}
                  className="p-2 border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Önceki"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={scrollNext}
                  disabled={!canScrollNext}
                  className="p-2 border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Sonraki"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <TabsContent value="new-arrivals" className="mt-0">
            <ProductCarouselContent
              products={newArrivals}
              scrollContainerRef={scrollContainerRef}
              checkScroll={checkScroll}
            />
          </TabsContent>
          <TabsContent value="best-sellers" className="mt-0">
            <ProductCarouselContent
              products={bestSellers}
              scrollContainerRef={scrollContainerRef}
              checkScroll={checkScroll}
            />
          </TabsContent>
          <TabsContent value="recommended" className="mt-0">
            <ProductCarouselContent
              products={recommended}
              scrollContainerRef={scrollContainerRef}
              checkScroll={checkScroll}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

interface ProductCarouselContentProps {
  products: Product[];
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  checkScroll: () => void;
}

function ProductCarouselContent({
  products,
  scrollContainerRef,
  checkScroll,
}: ProductCarouselContentProps) {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const handleOpenModal = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
    setSelectedSize(null);
    setSelectedColor(null);
    setModalOpen(true);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    
    if (!selectedSize) {
      toast.error("Lütfen bir beden seçin", {
        position: "bottom-left",
      });
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          colorId: selectedColor || selectedProduct.colorId || null,
          sizeId: selectedSize,
          quantity: 1,
        }),
      });

      if (res.ok) {
        window.dispatchEvent(new Event("cartUpdated"));
        toast.success(`${selectedProduct.title} sepete eklendi`, {
          position: "bottom-left",
        });
        setModalOpen(false);
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
  };

  const getAvailableSizes = (product: Product) => {
    if (product.sizes && product.sizes.length > 0) {
      return product.sizes;
    }
    if (product.sizeOptions && product.sizeOptions.length > 0) {
      return product.sizeOptions.map(so => ({ name: so.name, stock: 0, id: so.id }));
    }
    return [];
  };

  const getSizeStock = (product: Product, sizeId: string | null) => {
    if (!sizeId) return 0;
    
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(
        (v) => v.sizeId === sizeId && (v.colorId === selectedColor || v.colorId === product.colorId)
      );
      return variant?.stock || 0;
    }
    
    const size = product.sizes?.find((s) => s.id === sizeId);
    return size?.stock || 0;
  };

  return (
    <>
      <div className="relative">
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
                className="flex-shrink-0 w-64 md:w-72 snap-start bg-white group"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <Link href={`/product/${product.id}`} className="block">
                  <div className="relative aspect-square mb-4 overflow-hidden bg-gray-100">
                    {product.hoverImage ? (
                      <>
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover transition-opacity duration-500 group-hover:opacity-0"
                          sizes="(max-width: 768px) 256px, 288px"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop";
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
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop";
                        }}
                      />
                    )}
                    
                    {/* Hover'da "Seçenekleri Gör" butonu */}
                    {hoveredProduct === product.id && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={(e) => handleOpenModal(product, e)}
                          className="bg-white text-[#111] px-6 py-3 text-sm font-light uppercase tracking-wide hover:bg-gray-100 transition-colors"
                        >
                          Seçenekleri Gör
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-light text-[#111]/60 uppercase tracking-wide">
                      Make Up
                    </p>
                    <h3 className="text-sm font-light text-[#111]">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {product.originalPrice ? (
                        <>
                          <p className="text-base font-light text-[#111]">
                            ₺{product.price.toFixed(2)}
                          </p>
                          <p className="text-sm font-light text-[#111]/60 line-through">
                            ₺{product.originalPrice.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p className="text-base font-light text-[#111]">
                          ₺{product.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {selectedProduct && (
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Sol taraf - Ürün resmi */}
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={selectedProduct.hoverImage || selectedProduct.image}
                  alt={selectedProduct.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {selectedProduct.badge && (
                  <div className="absolute top-3 left-3 bg-[#111] text-white text-xs px-3 py-1.5 uppercase font-light">
                    {selectedProduct.badge === "İndirim" && selectedProduct.originalPrice
                      ? `${Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}% OFF`
                      : selectedProduct.badge}
                  </div>
                )}
              </div>

              {/* Sağ taraf - Ürün detayları */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-light text-[#111] mb-2">
                    {selectedProduct.title}
                  </h2>
                  <p className="text-sm text-[#111]/60 font-light mb-4">Dark Velvet</p>
                  
                  {/* Fiyat */}
                  <div className="flex items-center gap-3 mb-4">
                    {selectedProduct.originalPrice ? (
                      <>
                        <span className="text-2xl font-light text-[#111]">
                          ₺{selectedProduct.price.toFixed(2)}
                        </span>
                        <span className="text-lg font-light text-[#111]/60 line-through">
                          ₺{selectedProduct.originalPrice.toFixed(2)}
                        </span>
                        <span className="text-sm font-light text-[#111]/60">
                          {Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}% off
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-light text-[#111]">
                        ₺{selectedProduct.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Yıldız puanı */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= 4 ? "fill-[#111] text-[#111]" : "fill-gray-300 text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-[#111]/60 font-light">4.8 (4)</span>
                  </div>

                  {/* View product details link */}
                  <Link
                    href={`/product/${selectedProduct.id}`}
                    className="text-sm text-[#111] hover:underline font-light mb-6 inline-block"
                  >
                    View product details →
                  </Link>

                  {/* Renk seçimi */}
                  {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-light text-[#111] mb-3">
                        Color: {selectedColor || "Seçiniz"}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedProduct.colors.map((color, idx) => {
                          const colorValue = typeof color === "string" ? color : "#000000";
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedColor(colorValue)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                selectedColor === colorValue
                                  ? "border-[#111] scale-110"
                                  : "border-gray-300 hover:scale-105"
                              }`}
                              style={{ backgroundColor: colorValue }}
                              aria-label={`Renk seçeneği ${idx + 1}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Beden seçimi */}
                  <div className="mb-6">
                    <p className="text-sm font-light text-[#111] mb-3">
                      Size: {selectedSize || "Seçiniz"}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {getAvailableSizes(selectedProduct).map((size) => {
                        const sizeName = typeof size === "string" ? size : size.name;
                        const sizeId = typeof size === "object" && size.id ? size.id : null;
                        const stock = getSizeStock(selectedProduct, sizeId);
                        const isOutOfStock = stock <= 0;
                        const isSelected = selectedSize === sizeId || selectedSize === sizeName;

                        return (
                          <button
                            key={sizeId || sizeName}
                            onClick={() => {
                              if (!isOutOfStock) {
                                setSelectedSize(sizeId || sizeName);
                              }
                            }}
                            disabled={isOutOfStock}
                            className={`px-4 py-3 text-sm font-light border transition-all ${
                              isSelected
                                ? "border-[#111] bg-[#111] text-white"
                                : isOutOfStock
                                ? "border-gray-200 text-gray-400 line-through cursor-not-allowed bg-white"
                                : "border-gray-300 hover:border-[#111] bg-white text-[#111]"
                            }`}
                          >
                            {sizeName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ürün açıklaması */}
                  <div className="mb-6">
                    <p className="text-sm font-light text-[#111] leading-relaxed">
                      {selectedProduct.title} - Premium kalite ve zarif tasarım ile üretilmiştir.
                    </p>
                  </div>

                  {/* Özellikler */}
                  <div className="mb-6">
                    <ul className="space-y-2 text-sm font-light text-[#111]">
                      <li>• Premium kumaş</li>
                      <li>• Yüksek kalite</li>
                      <li>• Zarif tasarım</li>
                    </ul>
                  </div>

                  {/* Sepete ekle butonu */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedSize}
                    className={`w-full py-6 text-base font-light uppercase tracking-wide ${
                      selectedSize
                        ? "bg-[#111] text-white hover:bg-[#333]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {selectedSize ? "Sepete Ekle" : "Select a Size"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
