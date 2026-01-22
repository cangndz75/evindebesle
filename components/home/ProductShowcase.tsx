"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Star, ShoppingBag } from "lucide-react";
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
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalSelectedColor, setModalSelectedColor] = useState<string | null>(null);
  const [modalSelectedSize, setModalSelectedSize] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  // const [showSuccessModal, setShowSuccessModal] = useState(false); // Removed - using header popup instead
  const [cartItemCount, setCartItemCount] = useState(0);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalProduct) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalProduct]);

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

  const openModal = (product: Product) => {
    setModalProduct(product);
    setModalSelectedColor(product.colorId || null);
    setModalSelectedSize(null);
  };

  const closeModal = () => {
    setModalProduct(null);
    setModalSelectedColor(null);
    setModalSelectedSize(null);
    setIsAddingToCart(false);
  };

  const handleAddToCart = async () => {
    if (!modalProduct || !modalSelectedSize) {
      toast.error("Lütfen beden seçiniz", { position: "bottom-left" });
      return;
    }

    setIsAddingToCart(true);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: modalProduct.id,
          colorId: modalSelectedColor || null,
          sizeId: modalSelectedSize,
          quantity: 1,
        }),
      });

      if (res.ok) {
        window.dispatchEvent(new Event("cartUpdated"));
        // Sepet sayısını al
        try {
          const cartRes = await fetch("/api/cart");
          if (cartRes.ok) {
            const cartItems = await cartRes.json();
            const total = Array.isArray(cartItems) 
              ? cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
              : 0;
            setCartItemCount(total);
          } else if (cartRes.status === 401) {
            // Giriş yapılmamışsa localStorage'dan al
            const localCart = localStorage.getItem("guestCart");
            const items = localCart ? JSON.parse(localCart) : [];
            const total = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
            setCartItemCount(total);
          }
        } catch (error) {
          console.error("Error loading cart count:", error);
        }
        
        // Seçili renk ve beden isimlerini bul
        const selectedColorName = modalSelectedColor 
          ? (modalProduct.colors.find(c => c.image === modalSelectedColor)?.name || null)
          : null;
        
        const selectedSizeName = modalSelectedSize 
          ? (() => {
              const availableSizes = modalProduct.sizes && modalProduct.sizes.length > 0
                ? modalProduct.sizes
                : modalProduct.sizeOptions && modalProduct.sizeOptions.length > 0
                ? modalProduct.sizeOptions.map(so => ({ name: so.name, stock: 0, id: so.id }))
                : [];
              
              const foundSize = availableSizes.find((s: any) => {
                if (typeof s === 'string') {
                  return s === modalSelectedSize;
                }
                return s.id === modalSelectedSize || s.name === modalSelectedSize;
              });
              return foundSize 
                ? (typeof foundSize === 'string' ? foundSize : foundSize.name)
                : modalSelectedSize;
            })()
          : null;

        // Header'daki popup'ı tetikle
        window.dispatchEvent(new CustomEvent('itemAddedToCart', {
          detail: {
            product: {
              id: modalProduct.id,
              name: modalProduct.title,
              image: modalProduct.image,
              price: modalProduct.price || 0,
            },
            size: selectedSizeName || '',
            color: selectedColorName || '',
          }
        }));

        setIsAddingToCart(false);
        closeModal();
      } else if (res.status === 401) {
        // Giriş yapılmamışsa localStorage'a kaydet
        const cartItem = {
          id: `guest_${Date.now()}`,
          productId: modalProduct.id,
          colorId: modalSelectedColor || null,
          sizeId: modalSelectedSize,
          quantity: 1,
          product: {
            id: modalProduct.id,
            name: modalProduct.title,
            price: modalProduct.price || 0,
            image: modalProduct.image,
            primaryImage: modalProduct.image,
            colors: modalProduct.colors || [],
            sizes: modalProduct.sizes || [],
          },
          color: modalSelectedColor ? modalProduct.colors.find(c => c.image === modalSelectedColor) : null,
          size: modalProduct.sizes?.find((s: any) => (typeof s === 'string' ? s : s.name) === modalSelectedSize || (typeof s === 'object' && s.id === modalSelectedSize)) || null,
        };

        const localCart = localStorage.getItem("guestCart");
        const items = localCart ? JSON.parse(localCart) : [];
        
        // Aynı ürün varsa miktarı artır
        const existingIndex = items.findIndex((item: any) => 
          item.productId === cartItem.productId &&
          item.colorId === cartItem.colorId &&
          item.sizeId === cartItem.sizeId
        );

        if (existingIndex >= 0) {
          items[existingIndex].quantity += 1;
        } else {
          items.push(cartItem);
        }

        localStorage.setItem("guestCart", JSON.stringify(items));
        window.dispatchEvent(new Event("cartUpdated"));
        
        const total = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        setCartItemCount(total);
        
        // Seçili renk ve beden isimlerini bul
        const selectedColorName = modalSelectedColor 
          ? (modalProduct.colors.find(c => c.image === modalSelectedColor)?.name || null)
          : null;
        
        const selectedSizeName = modalSelectedSize 
          ? (() => {
              const availableSizes = modalProduct.sizes && modalProduct.sizes.length > 0
                ? modalProduct.sizes
                : modalProduct.sizeOptions && modalProduct.sizeOptions.length > 0
                ? modalProduct.sizeOptions.map(so => ({ name: so.name, stock: 0, id: so.id }))
                : [];
              
              const foundSize = availableSizes.find((s: any) => {
                if (typeof s === 'string') {
                  return s === modalSelectedSize;
                }
                return s.id === modalSelectedSize || s.name === modalSelectedSize;
              });
              return foundSize 
                ? (typeof foundSize === 'string' ? foundSize : foundSize.name)
                : modalSelectedSize;
            })()
          : null;

        // Header'daki popup'ı tetikle
        window.dispatchEvent(new CustomEvent('itemAddedToCart', {
          detail: {
            product: {
              id: modalProduct.id,
              name: modalProduct.title,
              image: modalProduct.image,
              price: modalProduct.price || 0,
            },
            size: selectedSizeName || '',
            color: selectedColorName || '',
          }
        }));

        setIsAddingToCart(false);
        closeModal();
      } else {
        const error = await res.json();
        setIsAddingToCart(false);
        toast.error(error.error || "Sepete eklenirken bir hata oluştu", { position: "bottom-left" });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setIsAddingToCart(false);
      toast.error("Sepete eklenirken bir hata oluştu", { position: "bottom-left" });
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
                    <div
                      onClick={() => openModal(product)}
                      className="relative overflow-hidden block cursor-pointer"
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
                    </div>
                  
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
                  <div
                    onClick={() => openModal(product)}
                    className="relative overflow-hidden block cursor-pointer"
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
                  </div>
                  
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

      {/* Quick View Modal */}
      {modalProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 md:pt-8 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-[90vw] w-full max-h-[65vh] overflow-hidden flex flex-row relative transform transition-all mt-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 rounded-full transition-colors shadow-sm"
              aria-label="Kapat"
            >
              <X className="w-4 h-4 text-[#111]" />
            </button>

            {/* Product Image */}
            <div className="w-[35%] bg-gray-50 flex items-center justify-center p-6">
              <div className="relative w-full aspect-square max-w-md">
                <Image
                  src={(() => {
                    if (modalSelectedColor) {
                      const selectedColorObj = modalProduct.colors.find(c => c.image === modalSelectedColor);
                      return selectedColorObj?.image || modalProduct.image;
                    }
                    return modalProduct.image;
                  })()}
                  alt={modalProduct.title}
                  fill
                  className="object-contain"
                  sizes="40vw"
                  quality={90}
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="w-[65%] p-6 overflow-y-auto max-h-[65vh]">
              {/* Brand */}
              <p className="text-xs text-[#111]/60 font-light uppercase mb-1">DARK VELVET</p>
              
              <div className="mb-3">
                <h2 className="text-lg md:text-xl font-light text-[#111] mb-1 uppercase">
                  {modalProduct.title}
                </h2>
              </div>

              {/* Price */}
              {modalProduct.price && (
                <div className="mb-3">
                  <p className="text-lg font-light text-[#111]">
                    ₺{modalProduct.price.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= 4 ? "fill-[#111] text-[#111]" : "fill-none text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#111]/60 font-light">4.8 (4)</span>
              </div>

              {/* View Details Link */}
              <Link
                href={`/product/${modalProduct.id}`}
                className="text-xs text-[#111] hover:underline mb-4 inline-block"
                onClick={closeModal}
              >
                Ürün detaylarını görüntüle →
              </Link>

              {/* Color Selection */}
              {modalProduct.colors && modalProduct.colors.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-light text-[#111] mb-2">
                    Renk: <span className="text-[#111]/60">
                      {modalSelectedColor 
                        ? (modalProduct.colors.find(c => c.image === modalSelectedColor)?.name || "Seçiniz")
                        : "Seçiniz"}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {modalProduct.colors.map((color, idx) => {
                      const isSelected = modalSelectedColor === color.image;
                      return (
                        <button
                          key={idx}
                          onClick={() => setModalSelectedColor(color.image)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            isSelected
                              ? "border-[#111] scale-110"
                              : "border-gray-300 hover:border-[#111]"
                          }`}
                          style={{ backgroundColor: color.value }}
                          aria-label={color.name}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {(() => {
                const availableSizes = modalProduct.sizes && modalProduct.sizes.length > 0
                  ? modalProduct.sizes
                  : modalProduct.sizeOptions && modalProduct.sizeOptions.length > 0
                  ? modalProduct.sizeOptions.map(so => ({ name: so.name, stock: 0, id: so.id }))
                  : [];

                if (availableSizes.length === 0) return null;

                // Seçili bedenin ismini bul
                const selectedSizeName = modalSelectedSize 
                  ? (() => {
                      const foundSize = availableSizes.find((s: any) => {
                        if (typeof s === 'string') {
                          return s === modalSelectedSize;
                        }
                        return s.id === modalSelectedSize || s.name === modalSelectedSize;
                      });
                      return foundSize 
                        ? (typeof foundSize === 'string' ? foundSize : foundSize.name)
                        : modalSelectedSize;
                    })()
                  : null;

                return (
                  <div className="mb-4">
                    <label className="block text-xs font-light text-[#111] mb-2">
                      Beden: <span className="text-[#111]/60">{selectedSizeName || "Seçiniz"}</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSizes.map((size, sizeIdx) => {
                        const sizeName = typeof size === 'string' ? size : size.name;
                        const sizeId = typeof size === 'object' && size.id ? size.id : null;
                        const sizeStock = typeof size === 'object' ? size.stock : 0;
                        
                        let variantStock = 0;
                        if (modalSelectedColor && modalProduct.variants && modalProduct.colorId) {
                          const variant = modalProduct.variants.find((v: any) => 
                            v.colorId === modalProduct.colorId && v.sizeId === sizeId
                          );
                          variantStock = variant?.stock || 0;
                        }
                        
                        const finalStock = variantStock > 0 ? variantStock : sizeStock;
                        const isOutOfStock = finalStock <= 0;
                        const isSelected = modalSelectedSize === sizeId || modalSelectedSize === sizeName;

                        return (
                          <button
                            key={sizeIdx}
                            onClick={() => !isOutOfStock && setModalSelectedSize(sizeId || sizeName)}
                            disabled={isOutOfStock}
                            className={`px-3 py-2 text-xs font-light border transition-all ${
                              isOutOfStock
                                ? "border-gray-200 text-gray-400 line-through cursor-not-allowed bg-gray-50"
                                : isSelected
                                ? "border-[#111] bg-[#111] text-white"
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

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!modalSelectedSize || isAddingToCart}
                className={`w-full px-4 py-3 bg-[#111] text-white font-light text-xs uppercase tracking-wider transition-all mb-4 relative overflow-hidden group ${
                  !modalSelectedSize 
                    ? "opacity-50 cursor-not-allowed bg-gray-200 text-[#111]" 
                    : "hover:bg-[#333]"
                } ${isAddingToCart ? "cursor-wait" : ""}`}
              >
                {isAddingToCart ? (
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4 animate-[slideRight_0.6s_ease-out_forwards]" />
                    <span>Ekleniyor...</span>
                  </span>
                ) : modalSelectedSize ? (
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    <span>Sepete Ekle</span>
                  </span>
                ) : (
                  <span>Seçenekleri görün</span>
                )}
              </button>

              {/* Product Description */}
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-[#111]/80 font-light mb-2">
                  Premium kalite ve zarif tasarım ile üretilmiştir.
                </p>
                <ul className="space-y-1 text-xs text-[#111]/60 font-light">
                  <li>• Premium kumaş</li>
                  <li>• Yüksek kalite</li>
                  <li>• Zarif tasarım</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
