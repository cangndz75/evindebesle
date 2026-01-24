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
  slug?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  hoverImage?: string;
  colors: ColorOption[];
  badge?: string;
  inColors?: number;
};

type EditorialItem = {
  id: string;
  type: "editorial";
  image: string;
};

type GridItem = Product | EditorialItem;

type GridPosition = {
  type: 'large-left' | 'large-right' | 'small';
  row: number;
  col: number;
  span: { row: number; col: number };
};

type ProductWithGridPosition = Product & {
  _gridPosition?: GridPosition;
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

// Daha fazla ürün örneği ekleyelim
const generateProduct = (id: string, name: string, price: number, originalPrice?: number, badge?: string): Product => ({
  id,
  name,
  price,
  originalPrice,
  image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=600&auto=format&fit=crop",
  hoverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
  inColors: Math.floor(Math.random() * 5) + 2,
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
  badge,
});

// Statik ürünler sadece fallback olarak kullanılacak
const fallbackProducts: Product[] = [
  generateProduct("w1", "Premium Dantel Sütyen", 899, undefined, "Yeni"),
  generateProduct("w2", "Seamless Günlük Külot", 349),
  generateProduct("w3", "Saten İpek Takım", 1299, 1599),
  generateProduct("w4", "Transparan Dantel Body", 1499),
  generateProduct("w5", "Lüks Dantel Sütyen", 999),
  generateProduct("w6", "Günlük Külot 3'lü Paket", 449),
  generateProduct("w7", "Premium Body", 1299, 1499),
  generateProduct("w8", "Seamless Sütyen", 799),
  generateProduct("w9", "Dantel Külot", 299),
  generateProduct("w10", "Lüks Takım Set", 1899),
  generateProduct("w11", "Günlük Sütyen", 599),
  generateProduct("w12", "Premium Külot", 399),
  generateProduct("w13", "Dantel Sütyen Set", 1199),
  generateProduct("w14", "Seamless Body", 1099),
  generateProduct("w15", "Lüks Külot", 349),
  generateProduct("w16", "Premium Sütyen", 899),
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
  initialProducts = [],
  initialPriceRange = { min: 0, max: 2000 },
}: WomenProductsPageProps) {
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

  // Veritabanından gelen ürünleri kullan, yoksa fallback kullan
  const products = initialProducts.length > 0 ? initialProducts : fallbackProducts;

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
      priceRange: initialPriceRange,
    };
  }, [products, initialPriceRange]);

  // Grid düzeni: Döngüsel pattern
  // Pattern 1: Büyük sol (2x2) + Sağda 2 ürün dikey
  // Pattern 2: 4 ürün yatay
  // Pattern 3: Solda 2 ürün dikey + Büyük sağ (2x2)
  // Pattern 4: 4 ürün yatay
  // Bu döngü devam eder
  const gridItems: ProductWithGridPosition[] = useMemo(() => {
    const productItems = [...products];
    const items: ProductWithGridPosition[] = [];
    let productIndex = 0;
    let currentRow = 1;

    // Döngüsel pattern oluştur
    while (productIndex < productItems.length) {
      // Pattern 1: Büyük sol (2x2) + Sağda 2 ürün dikey
      if (productIndex < productItems.length) {
        items.push({
          ...productItems[productIndex],
          _gridPosition: { 
            type: 'large-left',
            row: currentRow,
            col: 1,
            span: { row: 2, col: 2 }
          }
        });
        productIndex++;
      }
      
      // Sağ üst ürün
      if (productIndex < productItems.length) {
        items.push({
          ...productItems[productIndex],
          _gridPosition: { 
            type: 'small',
            row: currentRow,
            col: 3,
            span: { row: 1, col: 1 }
          }
        });
        productIndex++;
      }
      
      // Sağ alt ürün
      if (productIndex < productItems.length) {
        items.push({
          ...productItems[productIndex],
          _gridPosition: { 
            type: 'small',
            row: currentRow + 1,
            col: 3,
            span: { row: 1, col: 1 }
          }
        });
        productIndex++;
      }
      
      currentRow += 2; // 2 satır kullandık
      
      // Pattern 2: 4 ürün yatay
      for (let i = 0; i < 4 && productIndex < productItems.length; i++) {
        items.push({
          ...productItems[productIndex],
          _gridPosition: { 
            type: 'small',
            row: currentRow,
            col: i + 1,
            span: { row: 1, col: 1 }
          }
        });
        productIndex++;
      }
      currentRow += 1; // 1 satır kullandık
      
      // Pattern 3: Solda 2 ürün dikey + Büyük sağ (2x2)
      // Sol üst
      if (productIndex < productItems.length) {
        items.push({
          ...productItems[productIndex],
          _gridPosition: { 
            type: 'small',
            row: currentRow,
            col: 1,
            span: { row: 1, col: 1 }
          }
        });
        productIndex++;
      }
      
      // Sol alt
      if (productIndex < productItems.length) {
        items.push({
          ...productItems[productIndex],
          _gridPosition: { 
            type: 'small',
            row: currentRow + 1,
            col: 1,
            span: { row: 1, col: 1 }
          }
        });
        productIndex++;
      }
      
      // Büyük sağ (2x2)
      if (productIndex < productItems.length) {
        items.push({
          ...productItems[productIndex],
          _gridPosition: { 
            type: 'large-right',
            row: currentRow,
            col: 3,
            span: { row: 2, col: 2 }
          }
        });
        productIndex++;
      }
      
      currentRow += 2; // 2 satır kullandık
      
      // Pattern 4: 4 ürün yatay
      for (let i = 0; i < 4 && productIndex < productItems.length; i++) {
        items.push({
          ...productItems[productIndex],
          _gridPosition: { 
            type: 'small',
            row: currentRow,
            col: i + 1,
            span: { row: 1, col: 1 }
          }
        });
        productIndex++;
      }
      currentRow += 1; // 1 satır kullandık
    }

    return items;
  }, [products]);

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
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-3 md:mb-4">
          <Link href="/" className="text-xs md:text-sm text-[#111]/60 font-light hover:text-[#111]">
            Ana Sayfa
          </Link>
          <span className="text-xs md:text-sm text-[#111]/60 font-light mx-2">/</span>
          <span className="text-xs md:text-sm text-[#111] font-light">Kadın</span>
        </nav>

        {/* Title */}
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-light text-[#111] mb-4 md:mb-6">
          Kadın
        </h1>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap flex-shrink-0 ${
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
        <div className="flex items-center justify-between mb-6 md:mb-8 gap-2 md:gap-4">
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
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-xs md:text-sm text-[#111]/60 font-light hidden md:inline">{products.length} ürün</span>
            
            {/* Mobil: Sırala Butonu */}
            <button
              onClick={() => setSortDialogOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-light text-[#111] border border-[#111] hover:bg-[#111] hover:text-white transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
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

        {/* Mobil: Basit 2 sütunlu grid, Desktop: Karmaşık editorial düzeni */}
        {/* Mobil Grid */}
        <div className="grid grid-cols-2 gap-4 md:hidden">
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
                <Link href={product.slug ? `/products/${product.slug}` : `/product/${product.id}`} className="block">
                  <div className="relative mb-3 overflow-hidden bg-gray-100 aspect-[3/4]">
                    <Image
                      src={currentImage}
                      alt={product.name}
                      fill
                      className="object-cover transition-opacity duration-500"
                      sizes="50vw"
                      unoptimized
                    />
                    {!isColorActive && product.hoverImage && (
                      <Image
                        src={product.hoverImage}
                        alt={`${product.name} hover`}
                        fill
                        className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        sizes="50vw"
                        unoptimized
                      />
                    )}
                    {product.badge && (
                      <div className="absolute top-3 left-3 bg-[#111] text-white uppercase font-light text-[10px] px-2 py-1">
                        {product.badge}
                      </div>
                    )}
                    <FavoriteButton productId={product.id} />
                  </div>
                </Link>

                <div className="space-y-1">
                  <h3 className="font-light text-[#111] text-xs line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    {product.originalPrice && product.originalPrice < product.price ? (
                      <>
                        <span className="font-light text-[#111] text-xs">
                          {product.originalPrice} ₺
                        </span>
                        <span className="text-[#111]/60 line-through text-[10px]">
                          {product.price} ₺
                        </span>
                      </>
                    ) : (
                      <span className="font-light text-[#111] text-xs">
                        {product.originalPrice ? product.originalPrice : product.price} ₺
                      </span>
                    )}
                  </div>
                  {product.inColors && (
                    <p className="text-[#111]/60 font-light text-[10px] mt-0.5">
                      {product.inColors} renk
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {product.colors.slice(0, 4).map((color, idx) => {
                    const isActive = isColorActive && activeColorImage === color.image;
                    return (
                      <button
                        key={idx}
                        onMouseEnter={() => handleColorInteraction(product.id, color.image)}
                        onMouseLeave={handleColorLeave}
                        onClick={() => handleColorInteraction(product.id, color.image)}
                        className={`w-3 h-3 rounded-full border transition-all duration-200 flex-shrink-0 ${
                          isActive ? "border-[#111] scale-110" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color.value }}
                        aria-label={`${color.name} renk seçeneği`}
                      />
                    );
                  })}
                  {product.colors.length > 4 && (
                    <span className="text-[10px] text-[#111]/60 font-light">
                      +{product.colors.length - 4}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Grid - Döngüsel pattern düzeni */}
        <div className="hidden md:grid md:grid-cols-4 gap-6 auto-rows-fr">
          {gridItems.map((item, index) => {
            // Ürün kartı
            const product = item as ProductWithGridPosition;
            
            // Grid pozisyonunu _gridPosition'dan al
            const gridPos = (product as ProductWithGridPosition)._gridPosition;
            let gridStyle: React.CSSProperties = {};
            
            if (gridPos) {
              const { row, col, span } = gridPos;
              if (span.row > 1 || span.col > 1) {
                // Büyük ürün (2x2)
                gridStyle = {
                  gridColumn: `${col} / ${col + span.col}`,
                  gridRow: `${row} / ${row + span.row}`
                };
              } else {
                // Küçük ürün (1x1)
                gridStyle = {
                  gridColumn: col.toString(),
                  gridRow: row.toString()
                };
              }
            }
            const isColorActive = hoveredColor?.productId === product.id || selectedColor?.productId === product.id;
            const activeColorImage = hoveredColor?.productId === product.id
              ? hoveredColor.colorImage
              : selectedColor?.productId === product.id
              ? selectedColor.colorImage
              : null;

            const currentImage = activeColorImage || product.image || "/placeholder.png";
            
            // Büyük ürünler için square, küçükler için 3/4 aspect ratio
            const isLarge = gridPos && (gridPos.span.row > 1 || gridPos.span.col > 1);
            const aspectClass = isLarge ? "aspect-square" : "aspect-[3/4]";

            return (
              <div key={product.id} className="group" style={gridStyle}>
                <Link href={product.slug ? `/products/${product.slug}` : `/product/${product.id}`} className="block">
                  <div className={`relative mb-3 overflow-hidden bg-gray-100 ${aspectClass}`}>
                    <Image
                      src={currentImage}
                      alt={product.name}
                      fill
                      className="object-cover transition-opacity duration-500"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 25vw"
                      unoptimized
                    />
                    {!isColorActive && product.hoverImage && (
                      <Image
                        src={product.hoverImage}
                        alt={`${product.name} hover`}
                        fill
                        className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 25vw"
                        unoptimized
                      />
                    )}
                    {product.badge && (
                      <div className="absolute top-3 left-3 bg-[#111] text-white uppercase font-light text-[10px] px-2 py-1">
                        {product.badge}
                      </div>
                    )}
                    <FavoriteButton productId={product.id} />
                  </div>
                </Link>

                <div className="space-y-1">
                  <h3 className="font-light text-[#111] text-xs md:text-sm">
                    {product.name}
                  </h3>
                  <div className="flex flex-col">
                    {product.originalPrice && product.originalPrice < product.price ? (
                      <>
                        <span className="font-light text-[#111] text-xs md:text-sm">
                          {product.originalPrice} ₺
                        </span>
                        <span className="text-[#111]/60 line-through text-xs">
                          {product.price} ₺
                        </span>
                      </>
                    ) : (
                      <span className="font-light text-[#111] text-xs md:text-sm">
                        {product.originalPrice ? product.originalPrice : product.price} ₺
                      </span>
                    )}
                  </div>
                  {product.inColors && (
                    <p className="text-[#111]/60 font-light text-[10px] md:text-xs mt-0.5">
                      {product.inColors} renk
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-2">
                  {product.colors.map((color, idx) => {
                    const isActive = isColorActive && activeColorImage === color.image;
                    return (
                      <button
                        key={idx}
                        onMouseEnter={() => handleColorInteraction(product.id, color.image)}
                        onMouseLeave={handleColorLeave}
                        onClick={() => handleColorInteraction(product.id, color.image)}
                        className={`w-3 h-3 rounded-full border transition-all duration-200 ${
                          isActive ? "border-[#111]" : "border-gray-300"
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
