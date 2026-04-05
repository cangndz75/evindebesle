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
  slug?: string;
};

const categories = [
  "All bags",
  "Backpacks",
  "Duffles",
  "Totes",
  "Crossbodies",
  "Garment bags",
  "Diaper bags",
];

const products: Product[] = [
  {
    id: "1",
    name: "The Everywhere Bag",
    price: 198,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    inColors: 7,
    colors: [
      {
        name: "Black",
        value: "#000000",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Blue",
        value: "#1E3A8A",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Green",
        value: "#065F46",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
    ],
    badge: "OUR PICK",
  },
  {
    id: "2",
    name: "The Commuter Backpack",
    price: 228,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    colors: [
      {
        name: "Gray",
        value: "#4B5563",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Black",
        value: "#000000",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Navy",
        value: "#1E3A8A",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Green",
        value: "#065F46",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Striped",
        value: "#E5E7EB",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "3",
    name: "The Weekender",
    price: 178,
    originalPrice: 198,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    inColors: 5,
    colors: [
      {
        name: "Navy",
        value: "#1E3A8A",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Black",
        value: "#000000",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "4",
    name: "The Overnight Bag",
    price: 163,
    originalPrice: 180,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    inColors: 6,
    colors: [
      {
        name: "Black",
        value: "#000000",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Navy",
        value: "#1E3A8A",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      },
    ],
  },
];

export default function ProductListingPage() {
  const [selectedCategory, setSelectedCategory] = useState("All bags");
  const [hoveredColor, setHoveredColor] = useState<{ productId: string; colorImage: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ productId: string; colorImage: string } | null>(null);

  const handleColorInteraction = (productId: string, colorImage: string) => {
    setHoveredColor({ productId, colorImage });
    setSelectedColor({ productId, colorImage });
  };

  const handleColorLeave = () => {
    setHoveredColor(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        
        <nav className="mb-4">
          <Link href="/" className="text-sm text-[#111]/60 font-light hover:text-[#111]">
            All products
          </Link>
          <span className="text-sm text-[#111]/60 font-light mx-2">/</span>
          <span className="text-sm text-[#111] font-light">Travel bags</span>
        </nav>

        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#111] mb-6">
          Travel bags
        </h1>

        
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm font-light uppercase tracking-wide transition-colors ${selectedCategory === category
                  ? "bg-[#111] text-white"
                  : "bg-white text-[#111] border border-[#111] hover:bg-[#111] hover:text-white"
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        
        <div className="flex items-center justify-between mb-8">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 text-sm font-light text-[#111] hover:opacity-70 transition-opacity">
                <Filter className="w-4 h-4" />
                FILTER
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-8 space-y-6">
                
                <div>
                  <h3 className="text-sm font-light uppercase mb-4">COLOR</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {["Black", "Blue", "Brown", "Gray", "Green", "Navy", "Red", "White"].map((color) => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.toLowerCase() === "white" ? "#fff" : color.toLowerCase() }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#111]/60 font-light">{products.length} products</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#111] font-light">Sort by:</span>
              <select className="text-sm font-light text-[#111] bg-transparent border-none focus:outline-none cursor-pointer">
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
              </select>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        
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
                <Link href={product.slug ? `/products/${product.slug}` : `/product/${product.id}`} className="block">
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
                      <div className="absolute top-3 right-3 bg-[#111] text-white text-[10px] px-2 py-1 uppercase font-light">
                        {product.badge}
                      </div>
                    )}
                    
                    <button
                      className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                      onClick={(e) => {
                        e.preventDefault();
                      }}
                      aria-label="Favorilere Ekle"
                    >
                      <Heart className="w-4 h-4 text-[#111]" />
                    </button>
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
                          From ${product.price}
                        </span>
                        <span className="text-sm text-[#111]/60 line-through">
                          ${product.originalPrice}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm md:text-base font-light text-[#111]">
                        ${product.price}
                      </span>
                    )}
                  </div>
                  {product.inColors && (
                    <p className="text-xs text-[#111]/60 font-light mt-1">
                      in {product.inColors} colors
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
                        className={`w-4 h-4 rounded-full border transition-all duration-200 hover:scale-110 ${isActive ? "border-[#111] scale-110" : "border-gray-300"
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
