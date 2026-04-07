"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Product } from "@/lib/homeData";
import { addToGuestCart } from "@/lib/cart-utils";
import { resolveSwatchHex } from "@/lib/color-swatch";

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
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
      setTimeout(checkScroll, 100);
    }
  };

  return (
    <section className="w-full bg-linear-to-b from-gray-50 to-white py-16 md:py-24">
      <div className="w-full">
        <Tabs
          defaultValue="new-arrivals"
          className="w-full"
          onValueChange={handleTabChange}
        >
          
          <div className="flex flex-col items-center mb-12 px-4">
            
            <div className="text-center mb-8">
              <span className="inline-block text-xs font-medium tracking-[0.3em] text-[#111]/40 uppercase mb-3">
                KEŞFET
              </span>
              <h2 className="text-3xl md:text-4xl font-light text-[#111] tracking-tight">
                Sizin İçin Seçtiklerimiz
              </h2>
            </div>

            
            <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full h-auto p-1.5 shadow-sm mx-4 md:mx-0">
              <TabsTrigger
                value="new-arrivals"
                className="px-4 md:px-6 py-2.5 text-xs font-medium uppercase tracking-wider rounded-full transition-all duration-300 data-[state=active]:bg-[#111] data-[state=active]:text-white data-[state=active]:shadow-md text-[#111]/60 hover:text-[#111]"
              >
                Yeni Gelenler
              </TabsTrigger>
              <TabsTrigger
                value="best-sellers"
                className="px-4 md:px-6 py-2.5 text-xs font-medium uppercase tracking-wider rounded-full transition-all duration-300 data-[state=active]:bg-[#111] data-[state=active]:text-white data-[state=active]:shadow-md text-[#111]/60 hover:text-[#111]"
              >
                En Çok Satanlar
              </TabsTrigger>
              <TabsTrigger
                value="recommended"
                className="px-4 md:px-6 py-2.5 text-xs font-medium uppercase tracking-wider rounded-full transition-all duration-300 data-[state=active]:bg-[#111] data-[state=active]:text-white data-[state=active]:shadow-md text-[#111]/60 hover:text-[#111]"
              >
                Önerilenler
              </TabsTrigger>
            </TabsList>
          </div>

          
          <div className="flex items-center justify-end gap-4 mb-6 px-4 md:px-8">
            {getViewAllLink() && (
              <Link
                href={getViewAllLink()!}
                className="text-xs font-medium text-[#111] hover:opacity-70 transition-opacity uppercase tracking-wider hidden sm:inline-flex items-center gap-2 group"
              >
                TÜMÜNÜ GÖR
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            <div className="flex gap-2">
              <button
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-[#111] hover:text-white hover:border-[#111] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#111] disabled:hover:border-gray-300"
                aria-label="Önceki"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-[#111] hover:text-white hover:border-[#111] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#111] disabled:hover:border-gray-300"
                aria-label="Sonraki"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
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
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
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
  const [reviews, setReviews] = useState<{ rating: number; userName: string; comment: string; createdAt: Date }[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<{ description?: string; detailText?: string } | null>(null);
  const [productColors, setProductColors] = useState<Array<{ id: string; name: string; hexCode?: string; image?: string; images?: string[]; variants?: any[] }>>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleOpenModal = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
    setSelectedSize(null);
    setSelectedColor(null);
    setProductColors([]);
    setProductImages([]);
    setSelectedImageIndex(0);
    setModalOpen(true);
    setReviews([]);
    setProductDetails(null);
    if (product.id) {
      fetch(`/api/admin-products/${product.id}/reviews?approved=true`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setReviews(data);
          } else {
            setReviews([]);
          }
        })
        .catch(() => setReviews([]));

      fetch(`/api/products/${product.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setProductDetails({
              description: data.description || "",
              detailText: data.detailText || "",
            });

            const parseImages = (images: string | null): string[] => {
              if (!images) return [];
              try {
                return JSON.parse(images);
              } catch {
                return [];
              }
            };

            const colors = (data.colors || []).map((c: any) => {
              const colorImages = parseImages(c.images);
              return {
                id: c.id,
                name: c.name,
                hexCode: c.hexCode,
                image: colorImages[0] || data.primaryImage || data.image,
                images: colorImages,
                variants: c.variants || [],
              };
            });

            setProductColors(colors);

            const allImages: string[] = [];
            if (data.primaryImage) allImages.push(data.primaryImage);
            if (data.secondaryImage && data.secondaryImage !== data.primaryImage) allImages.push(data.secondaryImage);
            if (data.image && !allImages.includes(data.image)) allImages.push(data.image);

            colors.forEach((color: any) => {
              if (color.images && color.images.length > 0) {
                color.images.forEach((img: string) => {
                  if (!allImages.includes(img)) allImages.push(img);
                });
              } else if (color.image && !allImages.includes(color.image)) {
                allImages.push(color.image);
              }
            });

            setProductImages(allImages.length > 0 ? allImages : [data.primaryImage || data.image || ""].filter(Boolean));
            setSelectedImageIndex(0);

            if (colors.length > 0 && !selectedColor) {
              setSelectedColor(colors[0].id);
            }

            const updatedProduct: Partial<Product> = {
              ...selectedProduct!,
              id: data.id || selectedProduct?.id || product.id, // ID'yi mutlaka koru
              slug: data.slug || selectedProduct?.slug,
              title: data.name || selectedProduct?.title,
              price: data.price ?? selectedProduct?.price ?? 0,
              originalPrice: data.originalPrice ?? selectedProduct?.originalPrice,
            };

            const selectedColorData = colors.find((c: any) => c.id === (selectedColor || colors[0]?.id));
            if (selectedColorData) {
              updatedProduct.image = selectedColorData.image || data.primaryImage || data.image;
              updatedProduct.hoverImage = selectedColorData.images?.[1] || data.secondaryImage;
              updatedProduct.variants = selectedColorData.variants?.map((v: any) => ({
                colorId: v.colorId,
                sizeId: v.sizeId,
                stock: v.stock,
              })) || [];
            } else {
              if (data.primaryImage || data.image) {
                updatedProduct.image = data.primaryImage || data.image;
              }
              if (data.secondaryImage) {
                updatedProduct.hoverImage = data.secondaryImage;
              }
            }

            if (data.sizes && Array.isArray(data.sizes) && data.sizes.length > 0) {
              updatedProduct.sizes = data.sizes.map((s: any) => ({
                name: s.name,
                stock: s.stock || 0,
                id: s.id,
              }));
            } else if (data.sizeOptions && Array.isArray(data.sizeOptions) && data.sizeOptions.length > 0) {
              updatedProduct.sizeOptions = data.sizeOptions.map((so: any) => ({
                name: so.name,
                id: so.id,
              }));
            }

            setSelectedProduct(updatedProduct as Product);
          }
        })
        .catch(() => setProductDetails(null));
    }
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    if (!selectedProduct.id) {
      toast.error("Ürün bilgisi bulunamadı", {
        position: "bottom-left",
      });
      return;
    }

    if (!selectedSize) {
      toast.error("Lütfen bir beden seçin", {
        position: "bottom-left",
      });
      return;
    }

    let colorIdToSend = null;
    if (selectedColor) {
      const colors = (selectedProduct.colors || []) as any[];
      const colorObj = colors.find((c: any) => {
        if (typeof c === 'string') {
          return c === selectedColor;
        }
        return c.id === selectedColor || c.image === selectedColor || c.value === selectedColor || c.name === selectedColor;
      });
      if (colorObj?.id) {
        colorIdToSend = colorObj.id;
      } else if (selectedColor && /^[a-f0-9-]{36}$/i.test(selectedColor)) {
        colorIdToSend = selectedColor;
      } else {
        colorIdToSend = selectedProduct.colorId || null;
      }
    } else {
      colorIdToSend = selectedProduct.colorId || null;
    }

    let sizeIdToSend = null;
    const availableSizes = getAvailableSizes(selectedProduct);
    const sizeObj = availableSizes.find((s: any) => {
      if (typeof s === 'string') {
        return s === selectedSize;
      }
      return s.id === selectedSize || s.name === selectedSize;
    });
    sizeIdToSend = sizeObj?.id || selectedSize;


    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: selectedProduct.id,
          colorId: colorIdToSend,
          sizeId: sizeIdToSend,
          quantity: 1,
        }),
      });

      if (res.ok) {
        const result = await res.json();

        if (!result.userId && result.product) {
          addToGuestCart(
            selectedProduct.id,
            colorIdToSend,
            sizeIdToSend,
            1,
            {
              id: result.product.id,
              name: result.product.name || selectedProduct.title,
              image: result.product.image || selectedProduct.image,
              price: result.product.price || selectedProduct.price || 0,
            },
            result.color || null,
            result.size || null
          );
        }

        window.dispatchEvent(new Event("cartUpdated"));

        let productImage = selectedProduct.image;

        if (selectedColor && productColors.length > 0) {
          const selectedColorData = productColors.find((c) => c.id === selectedColor);
          if (selectedColorData?.image) {
            productImage = selectedColorData.image;
          } else if (selectedColorData?.images && selectedColorData.images.length > 0) {
            productImage = selectedColorData.images[0];
          }
        }

        if (result.color?.images) {
          let colorImages: string[] = [];
          if (typeof result.color.images === 'string') {
            try {
              colorImages = JSON.parse(result.color.images);
            } catch {
              colorImages = [result.color.images];
            }
          } else if (Array.isArray(result.color.images)) {
            colorImages = result.color.images;
          }
          if (colorImages.length > 0) {
            productImage = colorImages[0];
          }
        } else if (result.product?.image) {
          productImage = result.product.image;
        }

        const colorName = result.color?.name || (selectedColor
          ? (() => {
            const colors = (selectedProduct.colors || []) as any[];
            const colorObj = colors.find((c: any) => {
              if (typeof c === 'string') {
                return c === selectedColor;
              }
              return c.id === selectedColor || c.image === selectedColor || c.value === selectedColor || c.name === selectedColor;
            });
            return colorObj ? (typeof colorObj === 'string' ? colorObj : colorObj.name) : null;
          })()
          : null);

        const sizeName = result.size?.name || (selectedSize
          ? (() => {
            const foundSize = getAvailableSizes(selectedProduct).find((s: any) => {
              if (typeof s === 'string') {
                return s === selectedSize;
              }
              return s.id === selectedSize || s.name === selectedSize;
            });
            return foundSize
              ? (typeof foundSize === 'string' ? foundSize : foundSize.name)
              : selectedSize;
          })()
          : null);

        window.dispatchEvent(
          new CustomEvent("itemAddedToCart", {
            detail: {
              product: {
                id: selectedProduct.id,
                name: result.product?.name || selectedProduct.title,
                image: productImage,
                price: result.product?.price || selectedProduct.price || 0,
              },
              size: sizeName || '',
              color: colorName || '',
            },
          })
        );

        setModalOpen(false);
      } else {
        const error = await res.json();
        toast.error(error.error || "Sepete eklenirken bir hata oluştu", {
          position: "bottom-left",
        });
      }
    } catch (error) {
      if (error instanceof Error && !error.message.includes('401')) {
        toast.error("Sepete eklenirken bir hata oluştu", {
          position: "bottom-left",
        });
      }
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

  const getSortedAvailableSizes = (product: Product) => {
    const sizes = getAvailableSizes(product);
    return [...sizes].sort((a, b) => {
      const aName = (typeof a === "string" ? a : a.name || "").trim().toUpperCase();
      const bName = (typeof b === "string" ? b : b.name || "").trim().toUpperCase();

      const aCup = aName.match(/^(\d+)([A-Z]+)$/);
      const bCup = bName.match(/^(\d+)([A-Z]+)$/);

      if (aCup && bCup) {
        if (aCup[2] !== bCup[2]) {
          return aCup[2].localeCompare(bCup[2], "tr", { sensitivity: "base" });
        }
        return Number(aCup[1]) - Number(bCup[1]);
      }

      return aName.localeCompare(bName, "tr", { numeric: true, sensitivity: "base" });
    });
  };

  const getSizeStock = (product: Product, sizeId: string | null) => {
    if (!sizeId) {
      return 0;
    }

    if (product.variants && product.variants.length > 0) {
      let actualColorId: string | null = selectedColor;
      if (selectedColor && productColors.length > 0) {
        const colorObj = productColors.find((c) => c.id === selectedColor);
        if (colorObj?.id) {
          actualColorId = colorObj.id;
        } else if (selectedColor && /^[a-f0-9-]{36}$/i.test(selectedColor)) {
          actualColorId = selectedColor;
        } else {
          actualColorId = product.colorId || null;
        }
      } else {
        actualColorId = product.colorId || null;
      }

      let variant = product.variants.find(
        (v) => v.sizeId === sizeId && v.colorId === actualColorId
      );

      if (!variant && product.colorId) {
        variant = product.variants.find(
          (v) => v.sizeId === sizeId && v.colorId === product.colorId
        );
      }

      if (!variant) {
        variant = product.variants.find(
          (v) => v.sizeId === sizeId && (v.colorId == null || v.colorId === "")
        );
      }

      if (!variant) {
        variant = product.variants.find((v) => v.sizeId === sizeId);
      }

      if (variant && variant.stock > 0) {
        return variant.stock;
      }

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
                className="shrink-0 w-64 md:w-72 snap-start bg-white group"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <Link href={product.slug ? `/products/${product.slug}` : `/product/${product.id}`} className="block">
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
                      Premium
                    </p>
                    <h3 className="text-sm font-light text-[#111]">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {product.originalPrice && product.originalPrice > product.price ? (
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
                          ₺{product.originalPrice ? product.originalPrice.toFixed(2) : product.price.toFixed(2)}
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

      
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[85vh] overflow-hidden p-0 flex flex-col md:flex-row my-8 md:my-12">
          <DialogTitle className="sr-only">Ürün Detayları</DialogTitle>
          {selectedProduct && (
            <>
              
              <div className="hidden md:flex md:w-[45%] md:sticky md:top-0 md:self-start md:flex-col md:items-center md:justify-start md:p-8 md:py-12 md:bg-gray-50 md:gap-4">
                
                <div className="relative w-full aspect-3/4 bg-gray-100">
                  {productImages.length > 0 && productImages[selectedImageIndex] ? (
                    <>
                      <Image
                        src={productImages[selectedImageIndex]}
                        alt={selectedProduct.title || "Ürün görseli"}
                        fill
                        className="object-cover"
                        sizes="50vw"
                        priority={selectedImageIndex === 0}
                      />
                      {selectedProduct.badge && (
                        <div className="absolute top-3 left-3 bg-[#111] text-white text-xs px-3 py-1.5 uppercase font-light">
                          {selectedProduct.badge === "İndirim" && selectedProduct.originalPrice
                            ? `%${Math.round(((selectedProduct.originalPrice - (selectedProduct.price || 0)) / selectedProduct.originalPrice) * 100)} İNDİRİM`
                            : selectedProduct.badge}
                        </div>
                      )}
                      
                      {productImages.length > 1 && (
                        <>
                          {selectedImageIndex > 0 && (
                            <button
                              onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                              aria-label="Önceki resim"
                            >
                              <ChevronLeft className="w-5 h-5 text-[#111]" />
                            </button>
                          )}
                          {selectedImageIndex < productImages.length - 1 && (
                            <button
                              onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                              aria-label="Sonraki resim"
                            >
                              <ChevronRight className="w-5 h-5 text-[#111]" />
                            </button>
                          )}
                        </>
                      )}
                    </>
                  ) : (selectedProduct.hoverImage || selectedProduct.image) ? (
                    <Image
                      src={selectedProduct.hoverImage || selectedProduct.image || ""}
                      alt={selectedProduct.title || "Ürün görseli"}
                      fill
                      className="object-cover"
                      sizes="50vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="h-8 w-8 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    </div>
                  )}
                </div>
                
                {productImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto w-full pb-2">
                    {productImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative shrink-0 w-16 h-20 bg-gray-100 rounded overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-[#111]' : 'border-transparent hover:border-gray-300'
                          }`}
                      >
                        <Image
                          src={img}
                          alt={`${selectedProduct.title} görsel ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              
              <div className="md:hidden relative aspect-3/4 bg-gray-100 w-full">
                {productImages.length > 0 && productImages[selectedImageIndex] ? (
                  <>
                    <Image
                      src={productImages[selectedImageIndex]}
                      alt={selectedProduct.title || "Ürün görseli"}
                      fill
                      className="object-cover"
                      sizes="100vw"
                      priority={selectedImageIndex === 0}
                    />
                    {selectedProduct.badge && (
                      <div className="absolute top-3 left-3 bg-[#111] text-white text-xs px-3 py-1.5 uppercase font-light">
                        {selectedProduct.badge === "İndirim" && selectedProduct.originalPrice
                          ? `%${Math.round(((selectedProduct.originalPrice - (selectedProduct.price || 0)) / selectedProduct.originalPrice) * 100)} İNDİRİM`
                          : selectedProduct.badge}
                      </div>
                    )}
                    
                    {productImages.length > 1 && (
                      <>
                        {selectedImageIndex > 0 && (
                          <button
                            onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md"
                            aria-label="Önceki resim"
                          >
                            <ChevronLeft className="w-5 h-5 text-[#111]" />
                          </button>
                        )}
                        {selectedImageIndex < productImages.length - 1 && (
                          <button
                            onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md"
                            aria-label="Sonraki resim"
                          >
                            <ChevronRight className="w-5 h-5 text-[#111]" />
                          </button>
                        )}
                      </>
                    )}
                  </>
                ) : (selectedProduct.hoverImage || selectedProduct.image) ? (
                  <Image
                    src={selectedProduct.hoverImage || selectedProduct.image || ""}
                    alt={selectedProduct.title || "Ürün görseli"}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="h-8 w-8 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  </div>
                )}
              </div>

              
              <div className="flex-1 overflow-y-auto space-y-4 p-6 md:p-8 md:py-12 min-w-0">
                <div>
                  <h2 className="text-2xl font-bold text-[#111] mb-2">
                    {selectedProduct.title || "Ürün"}
                  </h2>

                  
                  <div className="flex items-center gap-3 mb-4">
                    {(() => {
                      const selectedSizeStock = selectedSize
                        ? getSizeStock(selectedProduct, typeof selectedSize === 'string' && selectedSize.includes('-') ? null : selectedSize)
                        : null;
                      const shouldStrikeThrough = selectedSizeStock !== null && selectedSizeStock === 0;

                      const price = selectedProduct.price ?? 0;
                      const originalPrice = selectedProduct.originalPrice;

                      if (originalPrice && originalPrice !== price) {
                        const higherPrice = Math.max(price, originalPrice);
                        const lowerPrice = Math.min(price, originalPrice);
                        const discountPercent = Math.round(((higherPrice - lowerPrice) / higherPrice) * 100);

                        return (
                          <>
                            <span className={`text-2xl font-light ${shouldStrikeThrough ? 'text-[#111]/60 line-through' : 'text-[#111]'}`}>
                              ₺{lowerPrice.toFixed(2)}
                            </span>
                            <span className="text-lg font-light text-[#111]/60 line-through">
                              ₺{higherPrice.toFixed(2)}
                            </span>
                            <span className="text-sm font-light text-[#111]/60 whitespace-nowrap">
                              -{discountPercent}%
                            </span>
                          </>
                        );
                      } else {
                        return (
                          <span className={`text-2xl font-light ${shouldStrikeThrough ? 'text-[#111]/60 line-through' : 'text-[#111]'}`}>
                            ₺{price.toFixed(2)}
                          </span>
                        );
                      }
                    })()}
                  </div>

                  
                  {reviews.length > 0 ? (
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                          return (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= Math.round(avgRating) ? "fill-[#111] text-[#111]" : "fill-gray-300 text-gray-300"
                                }`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-sm text-[#111]/60 font-light">
                        {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} ({reviews.length})
                      </span>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <span className="text-sm text-[#111]/60 font-light">Henüz yorum yok</span>
                    </div>
                  )}

                  
                  {selectedProduct.slug ? (
                    <Link
                      href={`/products/${selectedProduct.slug}`}
                      className="text-sm text-[#111] hover:underline font-light mb-6 inline-block"
                    >
                      Ürün detayına git →
                    </Link>
                  ) : null}

                  
                  {productColors.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-light text-[#111] mb-3">
                        Renk: <span className="text-[#111]/60">
                          {selectedColor
                            ? productColors.find(c => c.id === selectedColor)?.name || "Seçiniz"
                            : "Seçiniz"}
                        </span>
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        {productColors.map((color) => {
                          const isSelected = selectedColor === color.id;
                          const colorImage = color.image || color.images?.[0];

                          return (
                            <button
                              key={color.id}
                              onClick={() => {
                                setSelectedColor(color.id);
                                setSelectedSize(null); // Renk değişince beden seçimini sıfırla

                                if (color.images && color.images.length > 0) {
                                  const colorImages = color.images;
                                  const allImages: string[] = [];
                                  if (colorImages[0]) allImages.push(colorImages[0]);
                                  if (colorImages[1] && colorImages[1] !== colorImages[0]) allImages.push(colorImages[1]);
                                  colorImages.slice(2).forEach((img: string) => {
                                    if (!allImages.includes(img)) allImages.push(img);
                                  });
                                  setProductImages(allImages.length > 0 ? allImages : [colorImage || ""].filter(Boolean));
                                  setSelectedImageIndex(0);
                                }

                                setSelectedProduct({
                                  ...selectedProduct!,
                                  image: colorImage || selectedProduct?.image,
                                  hoverImage: color.images?.[1] || color.images?.[0] || selectedProduct?.hoverImage,
                                  variants: color.variants?.map((v: any) => ({
                                    colorId: v.colorId,
                                    sizeId: v.sizeId,
                                    stock: v.stock,
                                  })) || [],
                                  colorId: color.id,
                                });
                              }}
                              className={`relative w-16 h-20 rounded overflow-hidden border-2 transition-all ${isSelected
                                ? "border-[#111] scale-105"
                                : "border-gray-300 hover:border-[#111] hover:scale-105"
                                }`}
                              aria-label={color.name || `Renk: ${color.id}`}
                            >
                              {colorImage ? (
                                <Image
                                  src={colorImage}
                                  alt={color.name || "Renk seçeneği"}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              ) : (
                                <div
                                  className="w-full h-full"
                                  style={{ backgroundColor: resolveSwatchHex({ name: color.name, hexCode: color.hexCode }) }}
                                />
                              )}
                              {isSelected && (
                                <div className="absolute inset-0 border-2 border-[#111] pointer-events-none" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  
                  <div className="mb-6">
                    <p className="text-sm font-light text-[#111] mb-3">
                      Beden: <span className="text-[#111]/60">
                        {selectedSize
                          ? (() => {
                            const foundSize = getAvailableSizes(selectedProduct).find((s: any) => {
                              if (typeof s === 'string') {
                                return s === selectedSize;
                              }
                              return s.id === selectedSize || s.name === selectedSize;
                            });
                            return foundSize
                              ? (typeof foundSize === 'string' ? foundSize : foundSize.name)
                              : selectedSize;
                          })()
                          : "Seçiniz"}
                      </span>
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {(() => {
                        const availableSizes = getSortedAvailableSizes(selectedProduct);
                        if (availableSizes.length > 0) {
                          return availableSizes.map((size) => {
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
                                className={`min-w-0 px-2 py-3 text-[13px] leading-none whitespace-nowrap text-center font-light border transition-all ${isSelected
                                  ? "border-[#111] bg-[#111] text-white"
                                  : isOutOfStock
                                    ? "border-gray-200 text-gray-400 line-through cursor-not-allowed bg-white"
                                    : "border-gray-300 hover:border-[#111] bg-white text-[#111]"
                                  }`}
                              >
                                {sizeName}
                              </button>
                            );
                          });
                        } else {
                          return (
                            <p className="text-sm text-[#111]/60 font-light col-span-4">Beden bilgisi bulunamadı</p>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  
                  {(productDetails?.description || productDetails?.detailText) && (
                    <div className="mb-6">
                      {productDetails.description && (
                        <p className="text-sm font-light text-[#111] leading-relaxed mb-2">
                          {productDetails.description}
                        </p>
                      )}
                      {productDetails.detailText && (
                        <div className="text-sm font-light text-[#111]/60 whitespace-pre-line">
                          {productDetails.detailText}
                        </div>
                      )}
                    </div>
                  )}

                  
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedSize}
                    className={`w-full py-6 text-base font-light uppercase tracking-wide ${selectedSize
                      ? "bg-[#111] text-white hover:bg-[#333]"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    {selectedSize ? "Sepete Ekle" : "Beden Seçiniz"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
