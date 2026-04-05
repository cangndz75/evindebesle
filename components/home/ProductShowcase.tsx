"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/stores/cartStore";
import type { Product, ColorOption } from "@/lib/homeData";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const isBase64Image = (url: string | undefined | null): boolean => {
  if (!url) return false;
  return url.startsWith("data:image/") || url.length > 10000;
};

const filterBase64Images = (image: string | undefined | null): string | undefined => {
  if (!image) return undefined;
  if (isBase64Image(image)) {
    return undefined;
  }
  return image;
};

interface ProductShowcaseProps {
  products: Product[];
}

export default function ProductShowcase({ products = [] }: ProductShowcaseProps) {
  const addItemOptimistic = useCartStore((state) => state.addItemOptimistic);

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

  const [selectedOptions, setSelectedOptions] = useState<Record<string, {
    colorId: string | null;
    sizeId: string | null;
    colorImage: string | null;
    colorObj: ColorOption | null;
  }>>({});
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    products.forEach((product) => {
      if (!selectedOptions[product.id]) {
        const normalizedColors = normalizeColors(product.colors);
        if (normalizedColors.length > 0) {
          const firstColor = normalizedColors[0];
          setSelectedOptions((prev) => ({
            ...prev,
            [product.id]: {
              colorId: firstColor.id || null,
              sizeId: null,
              colorImage: firstColor.image,
              colorObj: firstColor,
            },
          }));
        }
      }
    });
  }, [products]);

  const normalizeColors = (colors?: ColorOption[] | string[]): ColorOption[] => {
    if (!colors || colors.length === 0) return [];
    if (typeof colors[0] === 'object' && 'name' in colors[0] && 'value' in colors[0]) {
      return colors as ColorOption[];
    }
    return (colors as string[]).map((color, idx) => ({
      name: `Renk ${idx + 1}`,
      value: color,
      image: color,
    }));
  };

  const getAvailableSizes = (product: Product) => {
    if (product.sizes && product.sizes.length > 0) return product.sizes;
    if (product.sizeOptions && product.sizeOptions.length > 0) {
      return product.sizeOptions.map((so) => ({ name: so.name, stock: 0, id: so.id }));
    }
    return [];
  };

  const getVariantStock = (product: Product, sizeId: string | null, colorId: string | null) => {
    if (!sizeId) return 0;

    if (product.sizes && product.sizes.length > 0) {
      const sizeObj = product.sizes.find((s: any) => {
        if (typeof s === 'object' && s.id) {
          return s.id === sizeId || s.name === sizeId;
        }
        return false;
      });
      if (sizeObj && typeof sizeObj === 'object' && 'stock' in sizeObj) {
        const sizeStock = sizeObj.stock || 0;
        if (sizeStock > 0) {
          return sizeStock;
        }
      }
    }

    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(
        (v) => v.sizeId === sizeId && (v.colorId === colorId || (!v.colorId && !colorId))
      );
      if (variant && variant.stock > 0) {
        return variant.stock;
      }
    }

    return 0;
  };

  const handleColorSelect = (productId: string, color: ColorOption) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        colorId: color.id || null,
        colorImage: color.image,
        colorObj: color,
      },
    }));
  };

  const handleSizeSelect = async (productId: string, sizeId: string | null) => {
    if (!sizeId) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (addingToCart[productId]) return;

    setSelectedOptions((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        sizeId: sizeId,
      },
    }));

    const options = selectedOptions[productId] || {
      colorId: null,
      sizeId: null,
      colorImage: null,
      colorObj: null,
    };

    setAddingToCart((prev) => ({ ...prev, [productId]: true }));

    try {
      const sizes = getAvailableSizes(product);
      const sizeObj = sizes.find((s: any) => {
        if (typeof s === 'string') return s === sizeId;
        return s.id === sizeId || s.name === sizeId;
      });

      const colorId = options.colorId || product.colorId || null;
      const finalSizeId = sizeObj?.id || sizeId;

      const productImage = options.colorImage || product.image || "";

      const color = options.colorObj ? {
        id: options.colorObj.id || "",
        name: options.colorObj.name,
      } : null;

      const size = sizeObj && typeof sizeObj === 'object' ? {
        id: sizeObj.id || "",
        name: sizeObj.name,
      } : null;

      await addItemOptimistic({
        productId: product.id,
        colorId,
        sizeId: finalSizeId,
        quantity: 1,
        product: {
          id: product.id,
          name: product.title,
          image: productImage,
          price: product.price,
        },
        color,
        size,
      });

      window.dispatchEvent(new CustomEvent("itemAddedToCart", {
        detail: {
          product: {
            id: product.id,
            name: product.title,
            image: productImage,
            price: product.price,
          },
          size: size?.name || sizeId,
          color: color?.name || "",
        },
      }));

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Sepete eklenirken bir hata oluÅŸtu", { position: "bottom-left" });
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = async (product: Product) => {
    const options = selectedOptions[product.id] || {
      colorId: null,
      sizeId: null,
      colorImage: null,
      colorObj: null,
    };

    if (!options.sizeId) {
      toast.error("LÃ¼tfen bir beden seÃ§in", { position: "bottom-left" });
      return;
    }

    setAddingToCart((prev) => ({ ...prev, [product.id]: true }));

    try {
      const sizes = getAvailableSizes(product);
      const sizeObj = sizes.find((s: any) => {
        if (typeof s === 'string') return s === options.sizeId;
        return s.id === options.sizeId || s.name === options.sizeId;
      });

      const colorId = options.colorId || product.colorId || null;
      const finalSizeId = sizeObj?.id || options.sizeId;

      const productImage = options.colorImage || product.image || "";

      const color = options.colorObj ? {
        id: options.colorObj.id || "",
        name: options.colorObj.name,
      } : null;

      const size = sizeObj && typeof sizeObj === 'object' ? {
        id: sizeObj.id || "",
        name: sizeObj.name,
      } : null;

      await addItemOptimistic({
        productId: product.id,
        colorId,
        sizeId: finalSizeId,
        quantity: 1,
        product: {
          id: product.id,
          name: product.title,
          image: productImage,
          price: product.price,
        },
        color,
        size,
      });

      toast.success("Sepete eklendi", { position: "bottom-left" });
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Sepete eklenirken bir hata oluÅŸtu", { position: "bottom-left" });
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product.id]: false }));
    }
  };


  const getProductUrl = (product: Product) => {
    if (product.slug) return `/products/${product.slug}`;
    return `/products/${product.id}`;
  };

  return (
    <section className="w-full bg-white py-12 md:py-20 relative">
      <div className="w-full px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight uppercase">Ã–ne Ã‡Ä±kanlar</h2>
          {products.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 border-gray-200"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 border-gray-200"
                onClick={scrollNext}
                disabled={!canScrollNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#111]/60 font-light">HenÃ¼z Ã¼rÃ¼n bulunmuyor.</p>
          </div>
        ) : (
          <div 
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
          >
            {products.map((product) => {
              const normalizedColors = normalizeColors(product.colors);
              const sizes = getAvailableSizes(product);
              const options = selectedOptions[product.id] || {
                colorId: null,
                sizeId: null,
                colorImage: null,
                colorObj: null,
              };

              const currentImage = filterBase64Images(options.colorImage || product.image) ||
                product.image ||
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";

              const productUrl = getProductUrl(product);

              return (
                <div
                  key={product.id}
                  className="group flex flex-col bg-white snap-start w-[85vw] sm:w-[50vw] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] flex-shrink-0"
                >
                  {/* ÃœrÃ¼n GÃ¶rseli - TÄ±klanabilir */}
                  <Link href={productUrl} className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 mb-4 group">
                    <Image
                      src={currentImage}
                      alt={product.title}
                      fill
                      className="object-cover object-center transition-opacity duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      loading="lazy"
                      quality={90}
                    />
                    {product.hoverImage && filterBase64Images(product.hoverImage) && (
                      <Image
                        src={filterBase64Images(product.hoverImage)!}
                        alt={`${product.title} hover`}
                        fill
                        className="object-cover object-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 absolute inset-0"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        loading="lazy"
                        quality={90}
                      />
                    )}
                    {product.badge && (
                      <div className="absolute top-2 left-2 bg-[#111] text-white text-[10px] px-2 py-1 uppercase tracking-wide z-10">
                        {product.badge}
                      </div>
                    )}

                    {/* Beden SeÃ§imi - Hover ile gÃ¶rÃ¼nÃ¼r, gÃ¶rselin alt kÄ±smÄ±nda */}
                    {sizes.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 border-t border-gray-200">
                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                          {sizes.map((size: any, idx: number) => {
                            const sizeName = typeof size === "string" ? size : size.name;
                            const sizeId = typeof size === "object" && size.id ? size.id : sizeName;
                            const stock = typeof size === "object"
                              ? getVariantStock(product, sizeId, options.colorId)
                              : 0;
                            const isOutOfStock = stock <= 0;
                            const isSelected = options.sizeId === sizeId;

                            return (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!isOutOfStock) {
                                    handleSizeSelect(product.id, sizeId);
                                  }
                                }}
                                disabled={isOutOfStock}
                                className={`px-3 py-1.5 text-xs font-light border transition-all ${isSelected
                                    ? "border-[#111] bg-[#111] text-white"
                                    : isOutOfStock
                                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                      : "border-gray-300 hover:border-[#111] bg-white text-[#111]"
                                  }`}
                              >
                                {sizeName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Link>

                  {/* ÃœrÃ¼n Bilgileri */}
                  <div className="flex-1 flex flex-col">
                    <Link href={productUrl} className="mb-2">
                      <h3 className="text-sm font-light text-[#111] uppercase tracking-wide line-clamp-2">
                        {product.title}
                      </h3>
                    </Link>

                    {/* Fiyat */}
                    {product.price != null && (
                      <div className="flex items-center gap-2 mb-3">
                        {product.originalPrice ? (
                          <>
                            <p className="text-sm font-light text-[#111]">â‚º{product.originalPrice.toFixed(2)}</p>
                            <p className="text-sm font-light text-gray-400 line-through">
                              â‚º{product.price.toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-light text-[#111]">
                            â‚º{product.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Renk SeÃ§imi */}
                    {normalizedColors.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {normalizedColors.map((color, idx) => {
                            const colorKey = color.id || color.image || color.value;
                            const isSelected = options.colorId === colorKey ||
                              (options.colorImage === color.image) ||
                              (!options.colorId && !options.colorImage && idx === 0);

                            return (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleColorSelect(product.id, color);
                                }}
                                className={`w-4 h-4 rounded-full border transition-all ${isSelected
                                    ? "border-[#111] scale-125"
                                    : "border-gray-300 hover:scale-110"
                                  }`}
                                style={{ backgroundColor: color.value }}
                                aria-label={color.name}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
