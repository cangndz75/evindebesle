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
  name: string;
  hexCode?: string;
  images: string[];
  variants?: any[];
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
  tags: any[];
};

type Favorite = {
  id: string;
  productId: string;
  product: Product;
  createdAt: Date;
};

type BestSeller = {
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
  bestSellers,
}: {
  favorites: Favorite[];
  bestSellers: BestSeller[];
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
      // Share link oluştur
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

  // Sayfa yüklendiğinde scroll'u en üste al
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-white pt-[65px] md:pt-[81px]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-16">
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
                <div key={favorite.id} className="group">
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

                  <div className="mb-2">
                    <h3 className="text-sm md:text-base font-light text-[#111] mb-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm md:text-base font-light text-[#111]">
                        {product.price.toFixed(2)} ₺
                      </span>
                    </div>
                    {product.colors && product.colors.length > 0 && (
                      <p className="text-xs text-[#111]/60 font-light mt-1">
                        {product.colors.length} renk seçeneği
                      </p>
                    )}
                  </div>

                  {/* Renk seçenekleri */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {product.colors.map((color, idx) => (
                        <button
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
                </div>
              );
            })}
          </div>
        )}

        {/* Best Sellers Section */}
        {bestSellers.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-light text-[#111] mb-8 text-center">
              Çok Satanlar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {bestSellers.map((product) => {
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
