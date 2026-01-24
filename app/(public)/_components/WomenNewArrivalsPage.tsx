"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Filter, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { newArrivals } from "@/lib/homeData";

type ColorOption = {
  name: string;
  value: string;
  image: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  hoverImage?: string;
  colors: ColorOption[];
  badge?: string;
  inColors?: number;
};

// Favorite Button Component
function FavoriteButton({ productId }: { productId: string }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // TODO: Veritabanına bağlanacak
  };

  return (
    <button
      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
      onClick={handleToggle}
      aria-label="Favorilere Ekle"
    >
      <Heart 
        className={`w-4 h-4 transition-colors ${
          isFavorite ? "fill-red-500 text-red-500" : "text-[#111]"
        }`} 
      />
    </button>
  );
}

export default function WomenNewArrivalsPage() {
  const [hoveredColor, setHoveredColor] = useState<{ productId: string; colorImage: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ productId: string; colorImage: string } | null>(null);

  // Filter new arrivals for women (you can adjust this logic)
  const products: Product[] = newArrivals.map((p) => ({
    id: p.id,
    name: p.title,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
    hoverImage: p.hoverImage,
    colors: (p.colors || []).map((colorValue, idx) => {
      // Handle both string and ColorOption types
      const colorString = typeof colorValue === 'string' ? colorValue : colorValue.value;
      const colorName = typeof colorValue === 'string' ? `Renk ${idx + 1}` : colorValue.name;
      const colorImage = typeof colorValue === 'string' ? p.image : (colorValue.image || p.image);
      
      return {
        name: colorName,
        value: colorString,
        image: colorImage,
      };
    }),
    badge: p.badge,
    inColors: p.colors?.length,
  }));

  const handleColorInteraction = (productId: string, colorImage: string) => {
    setHoveredColor({ productId, colorImage });
    setSelectedColor({ productId, colorImage });
  };

  const handleColorLeave = () => {
    setHoveredColor(null);
  };

  return (
    <div className="min-h-screen bg-white pt-[65px] md:pt-[81px]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <Link href="/" className="text-sm text-[#111]/60 font-light hover:text-[#111]">
            Ana Sayfa
          </Link>
          <span className="text-sm text-[#111]/60 font-light mx-2">/</span>
          <Link href="/women" className="text-sm text-[#111]/60 font-light hover:text-[#111]">
            Kadın
          </Link>
          <span className="text-sm text-[#111]/60 font-light mx-2">/</span>
          <span className="text-sm text-[#111] font-light">Yeni Çıkanlar</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#111] mb-6">
          Yeni Çıkanlar
        </h1>

        {/* Filter and Sort */}
        <div className="flex items-center justify-between mb-8">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 text-sm font-light text-[#111] hover:opacity-70 transition-opacity">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">FILTER</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filtreler</SheetTitle>
              </SheetHeader>
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-sm font-light uppercase mb-4">RENK</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: "Koyu Bordo", value: "#5C1A1A" },
                      { name: "Bordo", value: "#800020" },
                      { name: "Açık Bordo", value: "#A52A2A" },
                      { name: "Koyu Kırmızı", value: "#8B0000" },
                      { name: "Burgundy", value: "#722F37" },
                      { name: "Maroon", value: "#6B1F1F" },
                      { name: "Koyu Burgundy", value: "#4A0E0E" },
                      { name: "Bordo Kırmızı", value: "#7B0000" },
                    ].map((color) => (
                      <button
                        key={color.name}
                        className="w-10 h-10 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-xs md:text-sm text-[#111]/60 font-light">{products.length} ürün</span>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-[#111] font-light hidden sm:inline">Sırala:</span>
              <select className="text-xs md:text-sm font-light text-[#111] bg-transparent border-none focus:outline-none cursor-pointer">
                <option>Öne Çıkanlar</option>
                <option>Fiyat: Düşükten Yükseğe</option>
                <option>Fiyat: Yüksekten Düşüğe</option>
                <option>En Yeni</option>
              </select>
              <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const isColorActive = hoveredColor?.productId === product.id || selectedColor?.productId === product.id;
            const activeColorImage = hoveredColor?.productId === product.id
              ? hoveredColor.colorImage
              : selectedColor?.productId === product.id
              ? selectedColor.colorImage
              : null;

            const currentImage = activeColorImage || product.image;

            return (
              <div key={product.id} className="group">
                <Link href={`/product/${product.id}`} className="block">
                  <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100">
                    <Image
                      src={currentImage}
                      alt={product.name}
                      fill
                      className="object-cover transition-opacity duration-500"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized
                    />
                    {!isColorActive && product.hoverImage && (
                      <Image
                        src={product.hoverImage}
                        alt={`${product.name} hover`}
                        fill
                        className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                      />
                    )}
                    {product.badge && (
                      <div className="absolute top-3 left-3 bg-[#111] text-white text-[10px] px-2 py-1 uppercase font-light">
                        {product.badge}
                      </div>
                    )}
                    <FavoriteButton productId={product.id} />
                  </div>
                </Link>

                <div className="mb-2">
                  <h3 className="text-sm md:text-base font-light text-[#111] mb-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {product.originalPrice ? (
                      <>
                        <span className="text-sm md:text-base font-light text-[#111]">
                          {product.price} ₺
                        </span>
                        <span className="text-sm text-[#111]/60 line-through">
                          {product.originalPrice} ₺
                        </span>
                      </>
                    ) : (
                      <span className="text-sm md:text-base font-light text-[#111]">
                        {product.price} ₺
                      </span>
                    )}
                  </div>
                  {product.inColors && (
                    <p className="text-xs text-[#111]/60 font-light mt-1">
                      {product.inColors} renk seçeneği
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {product.colors.map((color, idx) => {
                    const isActive = isColorActive && activeColorImage === color.image;
                    return (
                      <button
                        key={idx}
                        onMouseEnter={() => handleColorInteraction(product.id, color.image)}
                        onMouseLeave={handleColorLeave}
                        onClick={() => handleColorInteraction(product.id, color.image)}
                        className={`w-4 h-4 rounded-full border transition-all duration-200 hover:scale-110 ${
                          isActive ? "border-[#111] scale-110" : "border-gray-300"
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
      </div>
    </div>
  );
}
