"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Star, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { addToGuestCart } from "@/lib/cart-utils";

type ColorOption = {
  name: string;
  value: string;
  image: string;
  id?: string; // Renk ID'si (opsiyonel)
};

type Product = {
  id: string;
  title: string;
  price?: number;
  image: string;
  hoverImage?: string;
  colors?: ColorOption[] | string[];
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

  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalSelectedColor, setModalSelectedColor] = useState<string | null>(null);
  const [modalSelectedSize, setModalSelectedSize] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [products]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalProduct) closeModal();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalProduct]);

  useEffect(() => {
    if (!modalProduct) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalProduct]);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollPrev(scrollLeft > 0);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollPrev = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    setTimeout(checkScroll, 300);
  };

  const scrollNext = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    setTimeout(checkScroll, 300);
  };

  const handleColorInteraction = (productId: string, colorImage: string) => {
    setHoveredColor({ productId, colorImage });
    setSelectedColor({ productId, colorImage });
  };

  const handleColorLeave = () => {
    setHoveredColor(null);
    if (!isMobile) setSelectedColor(null);
  };

  const openModal = (product: Product) => {
    setModalProduct(product);
    const normalizedColors = normalizeColors(product.colors);
    const fallback = normalizedColors[0]?.image || product.image;
    setModalSelectedColor(product.colorId || fallback || null);
    setModalSelectedSize(null);
    setIsAddingToCart(false);
  };

  const closeModal = () => {
    setModalProduct(null);
    setModalSelectedColor(null);
    setModalSelectedSize(null);
    setIsAddingToCart(false);
  };

  // colors'ı ColorOption[] formatına normalize et
  const normalizeColors = (colors?: ColorOption[] | string[]): ColorOption[] => {
    if (!colors || colors.length === 0) return [];
    // Eğer zaten ColorOption[] formatındaysa direkt döndür
    if (typeof colors[0] === 'object' && 'name' in colors[0] && 'value' in colors[0]) {
      return colors as ColorOption[];
    }
    // string[] formatındaysa ColorOption[] formatına dönüştür
    return (colors as string[]).map((color, idx) => ({
      name: `Renk ${idx + 1}`,
      value: color,
      image: color, // string[] durumunda image olarak color değerini kullan
    }));
  };

  const getAvailableSizes = (product: Product) => {
    if (product.sizes && product.sizes.length > 0) return product.sizes;
    if (product.sizeOptions && product.sizeOptions.length > 0) {
      return product.sizeOptions.map((so) => ({ name: so.name, stock: 0, id: so.id }));
    }
    return [];
  };

  const getVariantStock = (product: Product, sizeId: string | null, colorKey: string | null) => {
    if (!sizeId) return 0;
    if (!product.variants || product.variants.length === 0) return 0;

    const variant =
      product.variants.find((v) => v.sizeId === sizeId && v.colorId === colorKey) ||
      product.variants.find((v) => v.sizeId === sizeId && v.colorId === product.colorId) ||
      product.variants.find((v) => v.sizeId === sizeId && (v.colorId == null || v.colorId === "")) ||
      null;

    return variant?.stock || 0;
  };

  const getSizeStock = (product: Product, sizeObj: { name: string; stock: number; id?: string }, colorKey: string | null) => {
    const sizeId = sizeObj.id || null;
    const variantStock = getVariantStock(product, sizeId, colorKey);
    if (variantStock > 0) return variantStock;
    return sizeObj.stock || 0;
  };

  const resolveModalImage = () => {
    if (!modalProduct) return "";
    if (!modalSelectedColor) return modalProduct.image;

    const normalizedColors = normalizeColors(modalProduct.colors);
    const byImage = normalizedColors.find((c) => c.image === modalSelectedColor);
    if (byImage?.image) return byImage.image;

    const byIdLike = normalizedColors.find((c) => c.value === modalSelectedColor || c.name === modalSelectedColor);
    if (byIdLike?.image) return byIdLike.image;

    return modalProduct.image;
  };

  const resolveSelectedColorName = () => {
    if (!modalProduct || !modalSelectedColor) return "";
    const normalizedColors = normalizeColors(modalProduct.colors);
    return normalizedColors.find((c) => c.image === modalSelectedColor)?.name || "";
  };

  const resolveSelectedSizeName = () => {
    if (!modalProduct || !modalSelectedSize) return "";
    const sizes = getAvailableSizes(modalProduct);
    const found = sizes.find((s: any) => {
      if (typeof s === "string") return s === modalSelectedSize;
      return s.id === modalSelectedSize || s.name === modalSelectedSize;
    });
    if (!found) return modalSelectedSize;
    return typeof found === "string" ? found : found.name;
  };

  const handleAddToCart = async () => {
    if (!modalProduct || !modalSelectedSize) {
      toast.error("Lütfen beden seçiniz", { position: "bottom-left" });
      return;
    }

    setIsAddingToCart(true);

    // Renk ID'sini bul - modalSelectedColor bir image URL olabilir, gerçek ID'yi bul
    let colorIdToSend = null;
    if (modalSelectedColor) {
      const normalizedColors = normalizeColors(modalProduct.colors);
      const colorObj = normalizedColors.find((c) => 
        c.image === modalSelectedColor || 
        (c.id && c.id === modalSelectedColor) || 
        c.value === modalSelectedColor || 
        c.name === modalSelectedColor
      );
      if (colorObj?.id) {
        colorIdToSend = colorObj.id;
      } else if (modalSelectedColor && /^[a-f0-9-]{36}$/i.test(modalSelectedColor)) {
        // UUID formatındaysa direkt kullan
        colorIdToSend = modalSelectedColor;
      } else {
        // Son çare olarak product'ın colorId'sini kullan
        colorIdToSend = modalProduct.colorId || null;
      }
    } else {
      colorIdToSend = modalProduct.colorId || null;
    }

    // Beden ID'sini bul
    let sizeIdToSend = null;
    const availableSizes = getAvailableSizes(modalProduct);
    const sizeObj = availableSizes.find((s: any) => {
      if (typeof s === 'string') {
        return s === modalSelectedSize;
      }
      return s.id === modalSelectedSize || s.name === modalSelectedSize;
    });
    sizeIdToSend = sizeObj?.id || modalSelectedSize;

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: modalProduct.id,
          colorId: colorIdToSend,
          sizeId: sizeIdToSend,
          quantity: 1,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        
        // Giriş yapmamış kullanıcı için localStorage'a kaydet
        if (!result.userId && result.product) {
          addToGuestCart(
            modalProduct.id,
            colorIdToSend,
            sizeIdToSend,
            1,
            {
              id: result.product.id,
              name: result.product.name || modalProduct.title,
              image: result.product.image || modalProduct.image,
              price: result.product.price || modalProduct.price || 0,
            },
            result.color || null,
            result.size || null
          );
          // saveGuestCart içinde event dispatch ediliyor, burada tekrar etmeye gerek yok
        } else {
          // Giriş yapmış kullanıcı için event dispatch et
          window.dispatchEvent(new Event("cartUpdated"));
        }

        // Pop-up için event gönder (modal kapanmadan önce)
        // API response'undan resim bilgisini al
        let productImage = modalProduct.image;
        if (result.color?.images) {
          // color.images JSON string olabilir
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
        
        window.dispatchEvent(
          new CustomEvent("itemAddedToCart", {
            detail: {
              product: {
                id: modalProduct.id,
                name: result.product?.name || modalProduct.title,
                image: productImage,
                price: result.product?.price || modalProduct.price || 0,
              },
              size: result.size?.name || resolveSelectedSizeName(),
              color: result.color?.name || resolveSelectedColorName(),
            },
          })
        );

        setIsAddingToCart(false);
        // Modal'ı kapatmayı biraz geciktir ki popup görünsün
        setTimeout(() => {
          closeModal();
        }, 100);
        return;
      }

      const error = await res.json().catch(() => null);
      setIsAddingToCart(false);
      toast.error(error?.error || "Sepete eklenirken bir hata oluştu", { position: "bottom-left" });
    } catch (e) {
      setIsAddingToCart(false);
      toast.error("Sepete eklenirken bir hata oluştu", { position: "bottom-left" });
    }
  };

  return (
    <section className="w-full bg-white py-12 md:py-20">
      <div className="w-full px-4 md:px-6">
        <div className="hidden md:block relative">
          <div className="overflow-hidden">
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ scrollBehavior: "smooth" }}
            >
              {products.map((product) => {
                const isColorActive = hoveredColor?.productId === product.id || selectedColor?.productId === product.id;

                const activeColorImage =
                  hoveredColor?.productId === product.id
                    ? hoveredColor.colorImage
                    : selectedColor?.productId === product.id
                    ? selectedColor.colorImage
                    : null;

                const currentImage = activeColorImage || product.image;
                const normalizedColors = normalizeColors(product.colors);

                return (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-[320px] snap-start group bg-white cursor-pointer"
                    onClick={() => openModal(product)}
                  >
                    <div className="relative w-full h-[600px] overflow-hidden bg-white">
                      <Image
                        src={currentImage}
                        alt={product.title}
                        fill
                        className="object-cover object-center transition-opacity duration-700"
                        sizes="320px"
                        loading="lazy"
                        quality={90}
                      />

                      {!isColorActive && product.hoverImage && (
                        <Image
                          src={product.hoverImage}
                          alt={`${product.title} hover`}
                          fill
                          className="object-cover object-center opacity-0 transition-opacity duration-700 group-hover:opacity-100 absolute inset-0"
                          sizes="320px"
                          loading="lazy"
                          quality={90}
                        />
                      )}
                    </div>

                    <div className="mt-4 px-2">
                      <h3 className="text-sm font-light text-[#111] mb-1 uppercase tracking-wide">{product.title}</h3>
                      {product.price != null && (
                        <p className="text-sm font-light text-[#111] mb-3">₺{product.price.toFixed(2)}</p>
                      )}

                      {normalizedColors.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {normalizedColors.map((color, idx) => {
                            const isActive =
                              (hoveredColor?.productId === product.id && hoveredColor.colorImage === color.image) ||
                              (selectedColor?.productId === product.id && selectedColor.colorImage === color.image);

                            return (
                              <button
                                key={idx}
                                onMouseEnter={() => setHoveredColor({ productId: product.id, colorImage: color.image })}
                                onMouseLeave={handleColorLeave}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleColorInteraction(product.id, color.image);
                                }}
                                className={`w-3 h-3 rounded-full border transition-all duration-200 ${
                                  isActive ? "border-[#111] scale-125" : "border-gray-300"
                                }`}
                                style={{ backgroundColor: color.value }}
                                aria-label={`${color.name} renk seçeneği`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {canScrollPrev && (
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 p-3 transition-all shadow-sm z-10"
              aria-label="Önceki"
            >
              <ChevronLeft className="w-5 h-5 text-[#111]" />
            </button>
          )}

          {canScrollNext && (
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 p-3 transition-all shadow-sm z-10"
              aria-label="Sonraki"
            >
              <ChevronRight className="w-5 h-5 text-[#111]" />
            </button>
          )}
        </div>

        <div className="md:hidden relative w-full overflow-hidden">
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            style={{ scrollBehavior: "smooth" }}
          >
            {products.map((product) => {
              const isColorActive = hoveredColor?.productId === product.id || selectedColor?.productId === product.id;

              const activeColorImage =
                hoveredColor?.productId === product.id
                  ? hoveredColor.colorImage
                  : selectedColor?.productId === product.id
                  ? selectedColor.colorImage
                  : null;

              const currentImage = activeColorImage || product.image;
              const normalizedColors = normalizeColors(product.colors);

              return (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-[calc(50%-8px)] snap-start group bg-white cursor-pointer"
                  onClick={() => openModal(product)}
                >
                  <div className="relative w-full h-[500px] overflow-hidden bg-white">
                    <Image
                      src={currentImage}
                      alt={product.title}
                      fill
                      className="object-cover object-center transition-opacity duration-700"
                      sizes="50vw"
                      loading="lazy"
                      quality={90}
                    />

                    {!isColorActive && product.hoverImage && (
                      <Image
                        src={product.hoverImage}
                        alt={`${product.title} hover`}
                        fill
                        className="object-cover object-center opacity-0 transition-opacity duration-700 group-hover:opacity-100 absolute inset-0"
                        sizes="50vw"
                        loading="lazy"
                        quality={90}
                      />
                    )}
                  </div>

                  <div className="mt-4 px-2">
                    <h3 className="text-xs font-light text-[#111] mb-1 uppercase tracking-wide">{product.title}</h3>
                    {product.price != null && (
                      <p className="text-sm font-light text-[#111] mb-3">₺{product.price.toFixed(2)}</p>
                    )}

                    {normalizedColors.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {normalizedColors.map((color, idx) => {
                          const isActive =
                            (hoveredColor?.productId === product.id && hoveredColor.colorImage === color.image) ||
                            (selectedColor?.productId === product.id && selectedColor.colorImage === color.image);

                          return (
                            <button
                              key={idx}
                              onMouseEnter={() => setHoveredColor({ productId: product.id, colorImage: color.image })}
                              onMouseLeave={handleColorLeave}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleColorInteraction(product.id, color.image);
                              }}
                              className={`w-3 h-3 rounded-full border transition-all duration-200 ${
                                isActive ? "border-[#111] scale-125" : "border-gray-300"
                              }`}
                              style={{ backgroundColor: color.value }}
                              aria-label={`${color.name} renk seçeneği`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {canScrollPrev && (
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 p-2 transition-all shadow-sm z-10"
              aria-label="Önceki"
            >
              <ChevronLeft className="w-4 h-4 text-[#111]" />
            </button>
          )}

          {canScrollNext && (
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 p-2 transition-all shadow-sm z-10"
              aria-label="Sonraki"
            >
              <ChevronRight className="w-4 h-4 text-[#111]" />
            </button>
          )}
        </div>

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

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#111]/60 font-light">Henüz ürün bulunmuyor.</p>
          </div>
        )}
      </div>

      {modalProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-6xl h-[88vh] bg-white rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full transition-colors shadow"
              aria-label="Kapat"
            >
              <X className="w-5 h-5 text-[#111]" />
            </button>

            <div className="h-full grid grid-rows-[auto_1fr_auto] md:grid-rows-1 md:grid-cols-2">
              <div className="md:hidden bg-gray-50 p-4">
                <div className="relative w-full aspect-square bg-gray-100 overflow-hidden rounded-md">
                  <Image
                    src={resolveModalImage()}
                    alt={modalProduct.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    quality={90}
                  />
                </div>
              </div>

              <div className="hidden md:flex bg-gray-50 p-6 items-center justify-center">
                <div className="relative w-full max-w-[720px] aspect-square bg-gray-100 overflow-hidden rounded-md">
                  <Image
                    src={resolveModalImage()}
                    alt={modalProduct.title}
                    fill
                    className="object-cover"
                    sizes="50vw"
                    quality={90}
                  />
                </div>
              </div>

              <div className="flex flex-col min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 md:px-8 md:py-8">
                  <p className="text-xs text-[#111]/60 font-light uppercase mb-2">DARK VELVET</p>

                  <h2 className="text-xl md:text-2xl font-light text-[#111] mb-2 uppercase">{modalProduct.title}</h2>

                  {modalProduct.price != null && (
                    <div className="mb-4">
                      <p className="text-xl font-light text-[#111]">₺{modalProduct.price.toFixed(2)}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= 4 ? "fill-[#111] text-[#111]" : "fill-gray-300 text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-[#111]/60 font-light">4.8 (4)</span>
                  </div>

                  <Link
                    href={`/product/${modalProduct.id}`}
                    className="text-sm text-[#111] hover:underline font-light inline-block mb-6"
                    onClick={closeModal}
                  >
                    View product details →
                  </Link>

                  {(() => {
                    const normalizedModalColors = normalizeColors(modalProduct.colors);
                    if (normalizedModalColors.length === 0) return null;
                    
                    return (
                      <div className="mb-6">
                        <p className="text-sm font-light text-[#111] mb-3">
                          Color: <span className="text-[#111]/60">{resolveSelectedColorName() || "Seçiniz"}</span>
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {normalizedModalColors.map((color, idx) => {
                          const isSelected = modalSelectedColor === color.image;
                          return (
                            <button
                              key={idx}
                              onClick={() => setModalSelectedColor(color.image)}
                              className={`w-9 h-9 rounded-full border-2 transition-all ${
                                isSelected ? "border-[#111] scale-110" : "border-gray-300 hover:scale-105"
                              }`}
                              style={{ backgroundColor: color.value }}
                              aria-label={color.name}
                            />
                          );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    const sizes = getAvailableSizes(modalProduct);
                    if (!sizes || sizes.length === 0) return null;

                    return (
                      <div className="mb-6">
                        <p className="text-sm font-light text-[#111] mb-3">
                          Size: <span className="text-[#111]/60">{resolveSelectedSizeName() || "Seçiniz"}</span>
                        </p>

                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {sizes.map((s: any, idx: number) => {
                            const sizeName = typeof s === "string" ? s : s.name;
                            const sizeId = typeof s === "object" && s.id ? s.id : null;

                            const stock =
                              typeof s === "object"
                                ? getSizeStock(modalProduct, s, modalSelectedColor || null)
                                : 0;

                            const isOutOfStock = stock <= 0;
                            const isSelected = modalSelectedSize === (sizeId || sizeName);

                            return (
                              <button
                                key={`${sizeId || sizeName}_${idx}`}
                                onClick={() => {
                                  if (!isOutOfStock) setModalSelectedSize(sizeId || sizeName);
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
                    );
                  })()}

                  <div className="mb-6">
                    <p className="text-sm font-light text-[#111] leading-relaxed">
                      {modalProduct.title} - Premium kalite ve zarif tasarım ile üretilmiştir.
                    </p>
                  </div>

                  <div className="mb-10">
                    <ul className="space-y-2 text-sm font-light text-[#111]">
                      <li>• Premium kumaş</li>
                      <li>• Yüksek kalite</li>
                      <li>• Zarif tasarım</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-gray-200 p-4 md:p-6 bg-white">
                  <button
                    onClick={handleAddToCart}
                    disabled={!modalSelectedSize || isAddingToCart}
                    className={`w-full py-4 md:py-5 text-base font-light uppercase tracking-wide transition-all ${
                      modalSelectedSize && !isAddingToCart
                        ? "bg-[#111] text-white hover:bg-[#333]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isAddingToCart ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        Ekleniyor...
                      </span>
                    ) : modalSelectedSize ? (
                      "Sepete Ekle"
                    ) : (
                      "Select a Size"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
