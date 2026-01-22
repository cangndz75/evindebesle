"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ChevronDown, ArrowUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AnnouncementBanner from "@/components/home/AnnouncementBanner";
import ProductFilters from "./ProductFilters";
import { useMemo } from "react";

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
  image?: string;
  hoverImage?: string;
  colors: ColorOption[];
  badge?: string;
  inColors?: number;
};

const categories = [
  "All",
  "Bras",
  "Underwear",
  "Shapewear",
  "Sets",
  "Loungewear",
  "Active",
];

const products: Product[] = [
  {
    id: "w1",
    name: "Premium Dantel Sütyen",
    price: 899,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    inColors: 5,
    colors: [
      {
        name: "Black",
        value: "#000000",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "White",
        value: "#FFFFFF",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      },
    ],
    badge: "Yeni",
  },
  {
    id: "w2",
    name: "Seamless Günlük Külot",
    price: 349,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    inColors: 4,
    colors: [
      {
        name: "Black",
        value: "#000000",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
      {
        name: "Nude",
        value: "#E8D5C4",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "w3",
    name: "Saten İpek Takım",
    price: 1299,
    originalPrice: 1599,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    inColors: 3,
    colors: [
      {
        name: "Black",
        value: "#000000",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "w4",
    name: "Transparan Dantel Body",
    price: 1499,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    inColors: 6,
    colors: [
      {
        name: "Black",
        value: "#000000",
        image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
      },
    ],
  },
];

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

type FilterState = {
  minPrice?: number;
  maxPrice?: number;
  sizes: string[];
  colors: string[];
  fabricTypes: string[];
};

type ActiveFilter = {
  type: "price" | "size" | "color" | "fabric";
  label: string;
  value: string;
};

type WomenProductsPageProps = {
  initialProducts?: Product[];
  initialPriceRange?: { min: number; max: number };
};

export default function WomenProductsPage({
  initialProducts,
  initialPriceRange = { min: 0, max: 2000 },
}: WomenProductsPageProps = {}) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [hoveredColor, setHoveredColor] = useState<{ productId: string; colorImage: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ productId: string; colorImage: string } | null>(null);
  const [sortOption, setSortOption] = useState("featured");
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sizes: [],
    colors: [],
    fabricTypes: [],
  });

  // Available options from products
  const availableOptions = useMemo(() => {
    const sizes = new Set<string>();
    const colors = new Set<string>();
    const prices = products.map((p) => p.price);

    products.forEach((product) => {
      product.colors.forEach((color) => {
        colors.add(color.name);
      });
    });

    return {
      sizes: Array.from(sizes),
      colors: Array.from(colors),
      fabricTypes: [] as string[],
      priceRange: {
        min: Math.min(...prices, 0),
        max: Math.max(...prices, 2000),
      },
    };
  }, []);

  // Active filters for display
  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const result: ActiveFilter[] = [];
    if (filters.minPrice || filters.maxPrice) {
      result.push({
        type: "price",
        label:
          filters.minPrice && filters.maxPrice
            ? `₺${filters.minPrice} - ₺${filters.maxPrice}`
            : filters.minPrice
            ? `₺${filters.minPrice}+`
            : `₺${filters.maxPrice}-`,
        value: `${filters.minPrice || ""}-${filters.maxPrice || ""}`,
      });
    }
    filters.sizes.forEach((size) => {
      result.push({ type: "size", label: size, value: size });
    });
    filters.colors.forEach((color) => {
      result.push({ type: "color", label: color, value: color });
    });
    filters.fabricTypes.forEach((fabric) => {
      result.push({ type: "fabric", label: fabric, value: fabric });
    });
    return result;
  }, [filters]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleRemoveFilter = (filter: ActiveFilter) => {
    const newFilters = { ...filters };
    switch (filter.type) {
      case "price":
        newFilters.minPrice = undefined;
        newFilters.maxPrice = undefined;
        break;
      case "size":
        newFilters.sizes = newFilters.sizes.filter((s) => s !== filter.value);
        break;
      case "color":
        newFilters.colors = newFilters.colors.filter((c) => c !== filter.value);
        break;
      case "fabric":
        newFilters.fabricTypes = newFilters.fabricTypes.filter(
          (f) => f !== filter.value
        );
        break;
    }
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      sizes: [],
      colors: [],
      fabricTypes: [],
    });
  };

  const handleColorInteraction = (productId: string, colorImage: string) => {
    setHoveredColor({ productId, colorImage });
    setSelectedColor({ productId, colorImage });
  };

  const handleColorLeave = () => {
    setHoveredColor(null);
  };

  return (
    <div className="min-h-screen bg-white pt-[65px] md:pt-[81px]">
      <AnnouncementBanner variant="pink" className="mb-0" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <Link href="/" className="text-sm text-[#111]/60 font-light hover:text-[#111]">
            Ana Sayfa
          </Link>
          <span className="text-sm text-[#111]/60 font-light mx-2">/</span>
          <span className="text-sm text-[#111] font-light">Kadın</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#111] mb-6">
          Kadın
        </h1>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap flex-shrink-0 ${
                selectedCategory === category
                  ? "bg-[#111] text-white"
                  : "bg-white text-[#111] border border-[#111] hover:bg-[#111] hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Filter and Sort */}
        <div className="flex items-center justify-between mb-8 gap-4">
          {/* Filtre Butonu - Sol */}
          <div className="flex items-center gap-2">
            <ProductFilters
              availableSizes={availableOptions.sizes}
              availableColors={availableOptions.colors}
              availableFabricTypes={availableOptions.fabricTypes}
              priceRange={availableOptions.priceRange}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              activeFilters={activeFilters}
              onRemoveFilter={handleRemoveFilter}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Sırala - Sağ */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#111]/60 font-light hidden md:inline">{products.length} ürün</span>
            
            {/* Mobil: Sırala Butonu */}
            <button
              onClick={() => setSortDialogOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 text-sm font-light text-[#111] border border-[#111] hover:bg-[#111] hover:text-white transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Sırala</span>
            </button>

            {/* Desktop: Sırala Dropdown */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-[#111] font-light">Sırala:</span>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[200px] border-none bg-transparent text-sm font-light text-[#111] focus:ring-0 focus:ring-offset-0">
                  <SelectValue>
                    {sortOption === "featured" && "Öne çıkan"}
                    {sortOption === "bestseller" && "En çok satan"}
                    {sortOption === "az" && "Alfabetik olarak, A-Z"}
                    {sortOption === "za" && "Alfabetik olarak, Z-A"}
                    {sortOption === "price-low" && "Fiyat, düşükten yükseğe"}
                    {sortOption === "price-high" && "Fiyat, yüksekten düşüğe"}
                    {sortOption === "date-old" && "Tarih, eskiden yeniye"}
                    {sortOption === "date-new" && "Tarih, yeniden eskiye"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Öne çıkan</SelectItem>
                  <SelectItem value="bestseller">En çok satan</SelectItem>
                  <SelectItem value="az">Alfabetik olarak, A-Z</SelectItem>
                  <SelectItem value="za">Alfabetik olarak, Z-A</SelectItem>
                  <SelectItem value="price-low">Fiyat, düşükten yükseğe</SelectItem>
                  <SelectItem value="price-high">Fiyat, yüksekten düşüğe</SelectItem>
                  <SelectItem value="date-old">Tarih, eskiden yeniye</SelectItem>
                  <SelectItem value="date-new">Tarih, yeniden eskiye</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Mobil Sırala Modal */}
        <Dialog open={sortDialogOpen} onOpenChange={setSortDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-left">Sırala</DialogTitle>
            </DialogHeader>
            <RadioGroup value={sortOption} onValueChange={setSortOption} className="mt-4">
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="featured" id="w-featured" />
                <Label htmlFor="w-featured" className="flex-1 cursor-pointer font-normal">
                  Öne çıkan
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="bestseller" id="w-bestseller" />
                <Label htmlFor="w-bestseller" className="flex-1 cursor-pointer font-normal">
                  En çok satan
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="az" id="w-az" />
                <Label htmlFor="w-az" className="flex-1 cursor-pointer font-normal">
                  Alfabetik olarak, A-Z
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="za" id="w-za" />
                <Label htmlFor="w-za" className="flex-1 cursor-pointer font-normal">
                  Alfabetik olarak, Z-A
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="price-low" id="w-price-low" />
                <Label htmlFor="w-price-low" className="flex-1 cursor-pointer font-normal">
                  Fiyat, düşükten yükseğe
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="price-high" id="w-price-high" />
                <Label htmlFor="w-price-high" className="flex-1 cursor-pointer font-normal">
                  Fiyat, yüksekten düşüğe
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="date-old" id="w-date-old" />
                <Label htmlFor="w-date-old" className="flex-1 cursor-pointer font-normal">
                  Tarih, eskiden yeniye
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3">
                <RadioGroupItem value="date-new" id="w-date-new" />
                <Label htmlFor="w-date-new" className="flex-1 cursor-pointer font-normal">
                  Tarih, yeniden eskiye
                </Label>
              </div>
            </RadioGroup>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setSortDialogOpen(false)}
                className="bg-[#800020] hover:bg-[#5C1A1A] text-white px-8"
              >
                BİTTİ
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const isColorActive = hoveredColor?.productId === product.id || selectedColor?.productId === product.id;
            const activeColorImage = hoveredColor?.productId === product.id
              ? hoveredColor.colorImage
              : selectedColor?.productId === product.id
              ? selectedColor.colorImage
              : null;

            const currentImage = activeColorImage || product.image || "/placeholder.png";

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
