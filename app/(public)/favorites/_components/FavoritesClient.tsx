"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ProductColor = {
  id?: string;
  name: string;
  hexCode?: string;
  images: string[];
  variants?: Array<{
    id: string;
    colorId: string | null;
    sizeId: string | null;
    stock: number;
    price: number | null;
  }>;
};

type Product = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  image?: string;
  primaryImage?: string;
  colors: ProductColor[];
  sizes: any[];
  sizeOptions?: any[];
  tags: any[];
};

type Favorite = {
  id: string;
  productId: string;
  product: Product;
  createdAt: Date;
};

type CompleteTheSetItem = {
  id: string;
  name: string;
  slug?: string | null;
  price: number;
  image?: string | null;
  primaryImage?: string | null;
  colors?: Array<{
    id: string;
    name: string;
    hexCode?: string | null;
    images: string[];
  }>;
};

export default function FavoritesClient({
  favorites,
  completeTheSet,
}: {
  favorites: Favorite[];
  completeTheSet: CompleteTheSetItem[];
}) {
  const [favoritesList, setFavoritesList] = useState(favorites);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const handleRemoveFavorite = async (productId: string, productName: string) => {
    try {
      const res = await fetch(`/api/favorites?productId=${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setFavoritesList(favoritesList.filter((f) => f.productId !== productId));
        toast.success(`${productName} favorilerden çıkarıldı`, {
          position: "bottom-left",
        });
      } else {
        toast.error("Bir hata oluştu");
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Bir hata oluştu");
    }
  };

  const handleShare = async () => {
    try {
      const res = await fetch("/api/favorites/share", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        const shareUrl = `${window.location.origin}/favorites/share?lid=${data.shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        setShareLink(shareUrl);
        toast.success("Paylaşım linki kopyalandı!", {
          position: "bottom-left",
        });
      } else {
        toast.error("Paylaşım linki oluşturulamadı");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Bir hata oluştu");
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#111]">
            Favorilerim
          </h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-[#111] hover:opacity-70 transition-opacity"
              >
                <span className="text-sm font-light uppercase tracking-wider">Paylaş</span>
                <Share2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Favori listenizi paylaş</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Favorites Grid */}
        {favoritesList.length === 0 ? (
          <div className="text-center py-12 text-[#111]/60">
            <p className="text-lg mb-4">Henüz favori ürününüz yok</p>
            <Link
              href="/men"
              className="text-[#111] underline hover:opacity-70"
            >
              Alışverişe başla
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-16 pl-2 md:pl-4">
            {favoritesList.map((favorite) => {
              const product = favorite.product;
              const productImage =
                product.colors?.[0]?.images?.[0] ||
                product.primaryImage ||
                product.image ||
                "/placeholder.jpg";

              const productUrl = product.slug
                ? `/products/${product.slug}`
                : `/product/${product.id}`;

              return (
                <div key={favorite.id} className="group relative overflow-hidden">
                  <Link href={productUrl} className="block">
                    <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100">
                      <Image
                        src={productImage}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveFavorite(product.id, product.name);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center transition-all hover:scale-110 z-10 shadow-sm"
                        aria-label="Favorilerden Çıkar"
                      >
                        <Heart className="w-4 h-4 fill-[#111] text-[#111]" />
                      </button>
                    </div>
                  </Link>
                  <div className="mb-2 text-center">
                    <h3 className="text-sm md:text-base font-light text-[#111] mb-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm md:text-base font-light text-[#111]">
                        {product.price.toFixed(2)} ₺
                      </span>
                    </div>
                  </div>

                  {/* Renk Seçenekleri */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      {Array.from(new Map(product.colors.filter((c: any) => c.images?.[0]).map((c: any) => [c.hexCode || c.name, c])).values()).map((color: any, idx: number) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-gray-300 transition-all duration-200 hover:scale-110"
                          style={{
                            backgroundColor: color.hexCode || "#ccc",
                          }}
                          aria-label={`${color.name} renk seçeneği`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Hover'da Hızlı Ekle Bölümü - Collapsible Grid */}
                  <div className="hidden md:grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100">
                    <div className="overflow-hidden">
                      <div className="mt-4 pt-4 border-t border-gray-100 px-4 pb-4">
                        <p className="text-[10px] tracking-[0.2em] font-light text-[#111]/40 uppercase mb-3 text-center">Hızlı ekle</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {(() => {
                            const availableSizes = product.sizes && product.sizes.length > 0
                              ? product.sizes
                              : product.sizeOptions && product.sizeOptions.length > 0
                                ? product.sizeOptions.map((so: any) => ({ name: so.name, stock: 0, id: so.id }))
                                : [];

                            if (availableSizes.length === 0) {
                              return (
                                <p className="text-xs text-gray-500">Beden seçeneği bulunmuyor</p>
                              );
                            }

                            const currentColorId = product.colors?.[0]?.id;
                            const SIZE_ORDER = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "XXXXL", "4XL"];

                            const inStockSizes = availableSizes.map((size: any) => {
                              const sizeName = typeof size === 'string' ? size : size.name;
                              const sizeStock = typeof size === 'object' ? size.stock : 0;
                              const sizeId = typeof size === 'object' && size.id ? size.id : null;

                              let variantStock = 0;
                              if (currentColorId && product.colors?.[0]?.variants) {
                                const variant = product.colors[0].variants.find((v: any) =>
                                  v.colorId === currentColorId && v.sizeId === sizeId
                                );
                                variantStock = variant?.stock || 0;
                              }

                              const finalStock = variantStock > 0 ? variantStock : sizeStock;
                              return { size, sizeName, sizeId, finalStock };
                            }).filter((item: any) => item.finalStock > 0).sort((a: any, b: any) => {
                              const orderA = SIZE_ORDER.indexOf(a.sizeName.toUpperCase());
                              const orderB = SIZE_ORDER.indexOf(b.sizeName.toUpperCase());
                              if (orderA !== -1 && orderB !== -1) return orderA - orderB;
                              if (orderA !== -1) return -1;
                              if (orderB !== -1) return 1;
                              return a.sizeName.localeCompare(b.sizeName);
                            });

                            if (inStockSizes.length === 0) {
                              return <p className="text-[10px] text-gray-400">Tükendi</p>;
                            }

                            return inStockSizes.map(({ size, sizeName, sizeId, finalStock }: any, sizeIdx: number) => {
                              const isOutOfStock = false;

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
                                        const productImage =
                                          product.colors?.[0]?.images?.[0] ||
                                          product.primaryImage ||
                                          product.image ||
                                          "/placeholder.jpg";

                                        window.dispatchEvent(
                                          new CustomEvent("itemAddedToCart", {
                                            detail: {
                                              product: {
                                                id: product.id,
                                                name: product.name,
                                                image: productImage,
                                                price: product.price,
                                              },
                                              size: sizeName,
                                              color: product.colors?.[0]?.name || "",
                                            },
                                          })
                                        );

                                        const cartModule = await import("@/lib/stores/cartStore");
                                        await cartModule.useCartStore.getState().refreshCart();

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
        )}

        {/* Takımı Tamamla Section */}
        {completeTheSet.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-light text-[#111] mb-8 text-center">
              Takımı Tamamla
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {completeTheSet.map((product: CompleteTheSetItem) => {
                const productImage =
                  product.colors?.[0]?.images?.[0] ||
                  product.primaryImage ||
                  product.image ||
                  "/placeholder.jpg";
                const productUrl = product.slug
                  ? `/products/${product.slug}`
                  : `/product/${product.id}`;

                return (
                  <div key={product.id} className="group">
                    <Link href={productUrl} className="block">
                      <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100">
                        <Image
                          src={productImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          unoptimized
                        />
                      </div>
                    </Link>

                    <div className="mb-2">
                      <h3 className="text-sm md:text-base font-light text-[#111] mb-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm md:text-base font-light text-[#111]">
                          {product.price.toFixed(2)} ₺
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
