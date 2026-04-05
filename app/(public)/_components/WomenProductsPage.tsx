"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Heart, ChevronDown, ArrowUpDown, Filter } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
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
import HoverImageSlider from "@/components/product/HoverImageSlider";

type ProductColor = {
  name: string;
  hexCode?: string;
  images: string[];
  variant?: {
    id: string;
    variantCode: string;
    colorId: string | null;
  };
  id?: string;
  variants?: Array<{ stock?: number | null }>;
};

type ProductSize = {
  name: string;
  stock: number;
};

type ProductTag = {
  name: string;
};

type Product = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  primaryImage?: string;
  secondaryImage?: string;
  colors: ProductColor[];
  sizes: ProductSize[];
  sizeOptions?: Array<{ name: string; isActive: boolean }>;
  tags: ProductTag[];
  badge?: string;
  inColors?: number;
  fabricType?: string;
};

function getProductTotalStock(product: Product): number {
  const variants = product.colors?.flatMap((color) => color.variants ?? []) ?? [];
  const variantStockTotal = variants.reduce((sum, variant) => sum + (Number(variant?.stock) || 0), 0);
  const sizeStockTotal = product.sizes?.reduce((sum, size) => sum + (Number(size.stock) || 0), 0) || 0;

  return Math.max(variantStockTotal, sizeStockTotal);
}

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

function FavoriteButton({ productId, productName }: { productId: string; productName: string }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const res = await fetch(`/api/favorites/check?productId=${productId}`);
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    };
    checkFavorite();
  }, [productId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?productId=${productId}`, {
          method: "DELETE",
        });
        setIsFavorite(false);
        toast.success(`${productName} favorilerden çıkarıldı`, {
          position: "bottom-left",
        });
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        setIsFavorite(true);
        toast.success(`${productName} favorilere eklendi`, {
          position: "bottom-left",
        });
      }
      window.dispatchEvent(new Event("favoriteUpdated"));
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center transition-all hover:scale-110 z-10 disabled:opacity-50 shadow-sm"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${isFavorite ? "fill-[#111] text-[#111]" : "text-[#111]"
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

type CategoryBasic = {
  name: string;
  slug: string;
};

function normalizeColorName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type BaseQuery = {
  tag?: string;
  newArrivals?: boolean;
  categorySlug?: string;
};

type WomenProductsPageProps = {
  initialProducts?: Product[];
  initialPriceRange?: { min: number; max: number };
  initialCategories?: CategoryBasic[];
  pageTitle?: string;
  breadcrumbCurrent?: string;
  baseQuery?: BaseQuery;
  hideCategoryFilters?: boolean;
};

export default function WomenProductsPage({
  initialProducts = [],
  initialPriceRange = { min: 0, max: 2000 },
  initialCategories = [],
  pageTitle = "Kadın",
  breadcrumbCurrent = "Kadın",
  baseQuery,
  hideCategoryFilters = false,
}: WomenProductsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sizes: [],
    colors: [],
    fabricTypes: [],
  });
  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(filters);
  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [sortOption, setSortOption] = useState("featured");
  const [sortDialogOpen, setSortDialogOpen] = useState(false);

  const [hoveredColor, setHoveredColor] = useState<{ productId: string; colorImage: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ productId: string; colorImage: string; variantCode?: string } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchedCategoryDataRef = useRef<Record<string, Product[]>>({});

  const hasActiveFilters =
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.fabricTypes.length > 0;

  const isSimpleCategoryBrowsing = !baseQuery?.tag && !baseQuery?.newArrivals && !baseQuery?.categorySlug && !hasActiveFilters;

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters]);

  const fetcher = useCallback(async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }, []);

  const prefetchCategoryData = useCallback(async (categorySlug: string) => {
    if (!isSimpleCategoryBrowsing || sortOption !== "featured") return;
    if (prefetchedCategoryDataRef.current[categorySlug]) return;

    const params = new URLSearchParams();
    params.append("gender", "FEMALE");
    params.append("gender", "UNISEX");
    if (categorySlug !== "All") {
      params.append("categorySlug", categorySlug);
    }
    params.append("sort", "featured");

    try {
      const data = await fetcher(`/api/products?${params.toString()}`);
      if (Array.isArray(data)) {
        prefetchedCategoryDataRef.current[categorySlug] = data;
      }
    } catch {
    }
  }, [fetcher, isSimpleCategoryBrowsing, sortOption]);

  const handleCategorySelect = useCallback((categorySlug: string) => {
    setSelectedCategory(categorySlug);

    if (isSimpleCategoryBrowsing && sortOption === "featured") {
      const cached = prefetchedCategoryDataRef.current[categorySlug];
      if (cached) {
        setProducts(cached);
      }
    }
  }, [isSimpleCategoryBrowsing, sortOption]);

  useEffect(() => {
    prefetchedCategoryDataRef.current.All = initialProducts;
  }, [initialProducts]);

  useEffect(() => {
    if (!isSimpleCategoryBrowsing || sortOption !== "featured" || hideCategoryFilters) return;
    initialCategories.forEach((category) => {
      void prefetchCategoryData(category.slug);
    });
  }, [initialCategories, prefetchCategoryData, isSimpleCategoryBrowsing, sortOption, hideCategoryFilters]);

  const buildApiUrl = useCallback(() => {
    const hasBaseQuery = Boolean(baseQuery?.tag || baseQuery?.newArrivals || baseQuery?.categorySlug);
    const hasFilters =
      hasBaseQuery ||
      selectedCategory !== "All" ||
      sortOption !== "featured" ||
      debouncedFilters.minPrice ||
      debouncedFilters.maxPrice ||
      debouncedFilters.sizes.length > 0 ||
      debouncedFilters.colors.length > 0 ||
      debouncedFilters.fabricTypes.length > 0;

    if (!hasFilters && initialProducts.length > 0) {
      return null;
    }

    const params = new URLSearchParams();
    params.append("gender", "FEMALE");
    params.append("gender", "UNISEX");

    if (baseQuery?.tag) {
      params.append("tag", baseQuery.tag);
    }

    if (baseQuery?.newArrivals) {
      params.append("newArrivals", "true");
    }

    if (baseQuery?.categorySlug) {
      params.append("categorySlug", baseQuery.categorySlug);
    }

    if (selectedCategory !== "All") {
      params.append("categorySlug", selectedCategory);
    }

    if (debouncedFilters.minPrice) {
      params.append("minPrice", debouncedFilters.minPrice.toString());
    }
    if (debouncedFilters.maxPrice) {
      params.append("maxPrice", debouncedFilters.maxPrice.toString());
    }

    debouncedFilters.sizes.forEach((size) => {
      params.append("size", size);
    });

    debouncedFilters.colors.forEach((color) => {
      params.append("color", color);
    });

    if (debouncedFilters.fabricTypes.length > 0) {
      params.append("fabricType", debouncedFilters.fabricTypes[0]);
    }

    params.append("sort", sortOption);

    return `/api/products?${params.toString()}`;
  }, [selectedCategory, debouncedFilters, initialProducts, sortOption, baseQuery]);

  const apiUrl = buildApiUrl();

  const { data: fetchedProducts, isLoading: swrLoading } = useSWR<Product[]>(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      fallbackData: initialProducts.length > 0 && !apiUrl ? initialProducts : undefined,
    }
  );

  useEffect(() => {
    if (fetchedProducts) {
      setProducts(fetchedProducts);
    } else if (!apiUrl && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [fetchedProducts, apiUrl, initialProducts]);

  useEffect(() => {
    setLoading(swrLoading);
  }, [swrLoading]);

  const availableOptions = useMemo(() => {
    const sizes = new Set<string>();
    const colors = new Map<string, { name: string; hexCode?: string }>();
    const fabricTypes = new Set<string>();

    products.forEach((product) => {
      product.colors.forEach((color) => {
        const normalized = normalizeColorName(color.name);
        if (!colors.has(normalized)) {
          colors.set(normalized, {
            name: color.name.trim(),
            hexCode: color.hexCode,
          });
        }
      });
      product.sizes?.forEach((size) => {
        sizes.add(size.name);
      });
      if (product.fabricType) {
        fabricTypes.add(product.fabricType);
      }
    });

    return {
      sizes: Array.from(sizes).sort(),
      colors: Array.from(colors.values())
        .sort((a, b) => a.name.localeCompare(b.name)),
      fabricTypes: Array.from(fabricTypes).sort(),
      priceRange: initialPriceRange,
    };
  }, [products, initialPriceRange]);

  const gridItems: ProductWithGridPosition[] = useMemo(() => {
    const productItems = [...products];
    const items: ProductWithGridPosition[] = [];
    let productIndex = 0;
    let currentRow = 1;

    while (productIndex < productItems.length) {
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

      for (let c = 3; c <= 4; c++) {
        for (let r = 0; r <= 1; r++) {
          if (productIndex < productItems.length) {
            items.push({
              ...productItems[productIndex],
              _gridPosition: {
                type: 'small',
                row: currentRow + r,
                col: c,
                span: { row: 1, col: 1 }
              }
            });
            productIndex++;
          }
        }
      }

      currentRow += 2; // 2 satır kullandık

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

      for (let c = 1; c <= 2; c++) {
        for (let r = 0; r <= 1; r++) {
          if (productIndex < productItems.length) {
            items.push({
              ...productItems[productIndex],
              _gridPosition: {
                type: 'small',
                row: currentRow + r,
                col: c,
                span: { row: 1, col: 1 }
              }
            });
            productIndex++;
          }
        }
      }

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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">
        
        <nav className="mb-3 md:mb-4">
          <Link href="/" className="text-xs md:text-sm text-[#111]/60 font-light hover:text-[#111]">
            Ana Sayfa
          </Link>
          <span className="text-xs md:text-sm text-[#111]/60 font-light mx-2">/</span>
          <span className="text-xs md:text-sm text-[#111] font-light">{breadcrumbCurrent}</span>
        </nav>

        
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-light text-[#111] mb-4 md:mb-6">
          {pageTitle}
        </h1>

        
        {!hideCategoryFilters && (
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => handleCategorySelect("All")}
            onMouseEnter={() => {
              if (isSimpleCategoryBrowsing && sortOption === "featured") {
                const cachedAll = prefetchedCategoryDataRef.current.All;
                if (cachedAll) setProducts(cachedAll);
              }
            }}
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap flex-shrink-0 ${
              selectedCategory === "All"
                ? "bg-[#111] text-white"
                : "bg-white text-[#111] border border-[#111] hover:bg-[#111] hover:text-white"
            }`}
          >
            TÜMÜ
          </button>
          {initialCategories.map((category) => (
            <button
              key={category.slug}
              onClick={() => handleCategorySelect(category.slug)}
              onMouseEnter={() => {
                void prefetchCategoryData(category.slug);
              }}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap flex-shrink-0 ${selectedCategory === category.slug
                ? "bg-[#111] text-white"
                : "bg-white text-[#111] border border-[#111] hover:bg-[#111] hover:text-white"
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        )}
        
        <div className="flex items-center justify-between mb-6 md:mb-8 gap-2 md:gap-4">
          
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
              resultCount={products.length}
              isLoading={loading}
            />
          </div>

          
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-xs md:text-sm text-[#111]/60 font-light hidden md:inline">{products.length} ürün</span>

            
            <button
              onClick={() => setSortDialogOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-light text-[#111] border border-[#111] hover:bg-[#111] hover:text-white transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sırala</span>
            </button>

            
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

        
        
        <div className="grid grid-cols-2 gap-4 md:hidden">
          {products.map((product) => {
            const totalStock = getProductTotalStock(product);
            const isOutOfStock = totalStock === 0;
            const isColorActive = hoveredColor?.productId === product.id || selectedColor?.productId === product.id;
            const activeColorImage = hoveredColor?.productId === product.id
              ? hoveredColor.colorImage
              : selectedColor?.productId === product.id
                ? selectedColor.colorImage
                : null;

            return (
              <div key={product.id} className={`group ${isOutOfStock ? "opacity-75" : ""}`}>
                <Link href={product.slug ? `/products/${product.slug}` : `/product/${product.id}`} className="block relative">
                  <HoverImageSlider
                    images={[
                      activeColorImage || product.image || "/placeholder.png",
                      product.secondaryImage
                    ].filter(Boolean) as string[]}
                    alt={product.name}
                    sizes="50vw"
                    className="mb-3"
                    isOutOfStock={isOutOfStock}
                    badge={
                      product.originalPrice && product.originalPrice > product.price ? (
                        <div className="absolute top-3 left-3 bg-[#111] text-white uppercase font-light text-[10px] px-2 py-1 z-10">
                          İndirim
                        </div>
                      ) : product.badge ? (
                        <div className="absolute top-3 left-3 bg-[#111] text-white uppercase font-light text-[10px] px-2 py-1 z-10">
                          {product.badge}
                        </div>
                      ) : null
                    }
                    favoriteButton={<FavoriteButton productId={product.id} productName={product.name} />}
                  />
                </Link>

                <div className="space-y-1">
                  <h3 className="font-light text-[#111] text-xs line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    {product.originalPrice && product.originalPrice > product.price ? (
                      <>
                        <span className="font-light text-[#111] text-xs">
                          {product.price} ₺
                        </span>
                        <span className="text-[#111]/60 line-through text-[10px]">
                          {product.originalPrice} ₺
                        </span>
                      </>
                    ) : (
                      <span className="font-light text-[#111] text-xs">
                        {product.price} ₺
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
                    const colorImg = color.images?.[0] || "";
                    const isActive = isColorActive && activeColorImage === colorImg;
                    return (
                      <button
                        key={idx}
                        onMouseEnter={() => handleColorInteraction(product.id, colorImg)}
                        onMouseLeave={handleColorLeave}
                        onClick={() => handleColorInteraction(product.id, colorImg)}
                        className={`w-3 h-3 rounded-full border transition-all duration-200 flex-shrink-0 ${isActive ? "border-[#111] scale-110" : "border-gray-300"
                          }`}
                        style={{ backgroundColor: color.hexCode || "#000000" }}
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

        
        <div className="hidden md:grid md:grid-cols-4 gap-6 auto-rows-fr">
          {gridItems.map((item, index) => {
            const product = item as ProductWithGridPosition;

            const gridPos = (product as ProductWithGridPosition)._gridPosition;
            let gridStyle: React.CSSProperties = {};

            if (gridPos) {
              const { row, col, span } = gridPos;
              if (span.row > 1 || span.col > 1) {
                gridStyle = {
                  gridColumn: `${col} / ${col + span.col}`,
                  gridRow: `${row} / ${row + span.row}`
                };
              } else {
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

            const isLarge = gridPos && (gridPos.span.row > 1 || gridPos.span.col > 1);
            const aspectClass = isLarge ? "aspect-square" : "aspect-[3/4]";

            const totalStock = getProductTotalStock(product);
            const isOutOfStock = totalStock === 0;

            return (
              <div key={product.id} className={`group ${isOutOfStock ? "opacity-75" : ""}`} style={gridStyle}>
                <Link href={product.slug ? `/products/${product.slug}` : `/product/${product.id}`} className="block">
                  <HoverImageSlider
                    images={[
                      activeColorImage || product.image || "/placeholder.png",
                      product.secondaryImage
                    ].filter(Boolean) as string[]}
                    alt={product.name}
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 25vw"
                    className="mb-3"
                    aspectRatio={isLarge ? "square" : "portrait"}
                    isOutOfStock={isOutOfStock}
                    badge={
                      product.badge ? (
                        <div className="absolute top-3 left-3 bg-[#111] text-white uppercase font-light text-[10px] px-2 py-1 z-10">
                          {product.badge}
                        </div>
                      ) : null
                    }
                    favoriteButton={<FavoriteButton productId={product.id} productName={product.name} />}
                  />
                </Link>

                <div className="space-y-1 text-center">
                  <h3 className="font-light text-[#111] text-xs md:text-sm">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {product.originalPrice && product.originalPrice > product.price ? (
                      <>
                        <span className="font-light text-[#111] text-xs md:text-sm">
                          {product.price} ₺
                        </span>
                        <span className="text-[#111]/60 line-through text-xs">
                          {product.originalPrice} ₺
                        </span>
                      </>
                    ) : (
                      <span className="font-light text-[#111] text-xs md:text-sm">
                        {product.price} ₺
                      </span>
                    )}
                  </div>
                </div>

                
                <div className="flex items-center justify-center gap-1 mt-2">
                  {Array.from(new Map(product.colors.filter((c: any) => c.images?.[0]).map((c: any) => [c.hexCode || c.name, c])).values()).map((color: any, idx) => {
                    const colorImg = color.images?.[0] || "";
                    const isActive = isColorActive && activeColorImage === colorImg;
                    return (
                      <button
                        key={idx}
                        onMouseEnter={() => handleColorInteraction(product.id, colorImg)}
                        onMouseLeave={handleColorLeave}
                        onClick={() => handleColorInteraction(product.id, colorImg)}
                        className={`w-3 h-3 rounded-full border transition-all duration-200 ${isActive ? "border-[#111]" : "border-gray-300"
                          }`}
                        style={{ backgroundColor: color.hexCode || "#000000" }}
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
