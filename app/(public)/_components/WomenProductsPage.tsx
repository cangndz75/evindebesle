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
  id?: string;
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
  sizeOptions?: Array<{ id?: string; name: string; isActive: boolean }>;
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

const COLOR_NAME_TO_HEX: Record<string, string> = {
  siyah: "#111111",
  black: "#111111",
  beyaz: "#F8F9FA",
  white: "#F8F9FA",
  gri: "#9CA3AF",
  gray: "#9CA3AF",
  grey: "#9CA3AF",
  antrasit: "#374151",
  lacivert: "#1E3A8A",
  navy: "#1E3A8A",
  mavi: "#2563EB",
  blue: "#2563EB",
  kirmizi: "#B91C1C",
  "kırmızı": "#B91C1C",
  red: "#B91C1C",
  bordo: "#7F1D1D",
  pembe: "#EC4899",
  pink: "#EC4899",
  mor: "#7C3AED",
  purple: "#7C3AED",
  yesil: "#166534",
  "yeşil": "#166534",
  green: "#166534",
  sari: "#EAB308",
  "sarı": "#EAB308",
  yellow: "#EAB308",
  turuncu: "#EA580C",
  orange: "#EA580C",
  kahverengi: "#7C4A2D",
  brown: "#7C4A2D",
  bej: "#C9B79C",
  beige: "#C9B79C",
  krem: "#E8DFC8",
  nude: "#D6B29A",
  ekru: "#F3E9D7",
  ecru: "#F3E9D7",
};

function getColorSwatchStyle(name: string, hexCode?: string) {
  if (hexCode && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hexCode.trim())) {
    return { backgroundColor: hexCode.trim() };
  }
  const normalized = normalizeColorName(name);
  return { backgroundColor: COLOR_NAME_TO_HEX[normalized] || "#D1D5DB" };
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
  const [pendingFilters, setPendingFilters] = useState<FilterState>(filters);
  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [sortOption, setSortOption] = useState("featured");
  const [sortDialogOpen, setSortDialogOpen] = useState(false);

  const [hoveredColor, setHoveredColor] = useState<{ productId: string; colorImage: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ productId: string; colorImage: string; variantCode?: string } | null>(null);

  const prefetchedCategoryDataRef = useRef<Record<string, Product[]>>({});

  const hasActiveFilters =
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.fabricTypes.length > 0;

  const isSimpleCategoryBrowsing = !baseQuery?.tag && !baseQuery?.newArrivals && !baseQuery?.categorySlug && !hasActiveFilters;

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
      filters.minPrice ||
      filters.maxPrice ||
      filters.sizes.length > 0 ||
      filters.colors.length > 0 ||
      filters.fabricTypes.length > 0;

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

    if (filters.minPrice) {
      params.append("minPrice", filters.minPrice.toString());
    }
    if (filters.maxPrice) {
      params.append("maxPrice", filters.maxPrice.toString());
    }

    filters.sizes.forEach((size) => {
      params.append("size", size);
    });

    filters.colors.forEach((color) => {
      params.append("color", color);
    });

    if (filters.fabricTypes.length > 0) {
      params.append("fabricType", filters.fabricTypes[0]);
    }

    params.append("sort", sortOption);

    return `/api/products?${params.toString()}`;
  }, [selectedCategory, filters, initialProducts, sortOption, baseQuery]);

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

    const optionsSource = initialProducts.length > 0 ? initialProducts : products;

    optionsSource.forEach((product) => {
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
  }, [initialProducts, products, initialPriceRange]);

  const previewResultCount = useMemo(() => {
    const selectedSizes = new Set(pendingFilters.sizes);
    const selectedColors = new Set(pendingFilters.colors.map((value) => normalizeColorName(value)));
    const selectedFabrics = new Set(pendingFilters.fabricTypes);

    return products.filter((product) => {
      if (pendingFilters.minPrice != null && product.price < pendingFilters.minPrice) {
        return false;
      }
      if (pendingFilters.maxPrice != null && product.price > pendingFilters.maxPrice) {
        return false;
      }
      if (selectedSizes.size > 0) {
        const hasSize = product.sizes.some((size) => selectedSizes.has(size.name));
        if (!hasSize) {
          return false;
        }
      }
      if (selectedColors.size > 0) {
        const hasColor = product.colors.some((color) => selectedColors.has(normalizeColorName(color.name)));
        if (!hasColor) {
          return false;
        }
      }
      if (selectedFabrics.size > 0) {
        if (!product.fabricType || !selectedFabrics.has(product.fabricType)) {
          return false;
        }
      }
      return true;
    }).length;
  }, [products, pendingFilters]);

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
    setPendingFilters(newFilters);
  };

  const handleApplyFilters = (nextFilters: FilterState) => {
    setFilters(nextFilters);
    setPendingFilters(nextFilters);
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
    setPendingFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      sizes: [],
      colors: [],
      fabricTypes: [],
    };
    setFilters(clearedFilters);
    setPendingFilters(clearedFilters);
  };

  const handleColorHover = (productId: string, colorImage: string) => {
    setHoveredColor({ productId, colorImage });
  };

  const handleColorSelect = (productId: string, colorImage: string, variantCode?: string) => {
    setSelectedColor({ productId, colorImage, variantCode });
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
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap shrink-0 ${
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
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap shrink-0 ${selectedCategory === category.slug
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
              filters={pendingFilters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={handleApplyFilters}
              activeFilters={activeFilters}
              onRemoveFilter={handleRemoveFilter}
              onClearFilters={handleClearFilters}
              resultCount={previewResultCount}
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
                <SelectTrigger className="w-50 border-none bg-transparent text-sm font-light text-[#111] focus:ring-0 focus:ring-offset-0">
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
            const productUrl = product.slug ? `/products/${product.slug}` : `/product/${product.id}`;
            const selectedVariantCode = selectedColor?.productId === product.id
              ? selectedColor.variantCode
              : product.colors?.[0]?.variant?.variantCode;
            const finalUrl = selectedVariantCode ? `${productUrl}?variant=${selectedVariantCode}` : productUrl;

            return (
              <div key={product.id} className={`group ${isOutOfStock ? "opacity-75" : ""}`}>
                <Link href={finalUrl} className="block relative">
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
                  <h3 className="font-light text-[#111] text-xs line-clamp-2 min-h-10">
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
                        onMouseEnter={() => handleColorHover(product.id, colorImg)}
                        onMouseLeave={handleColorLeave}
                        onClick={() => handleColorSelect(product.id, colorImg, color.variant?.variantCode)}
                        className={`w-3 h-3 rounded-full border transition-all duration-200 shrink-0 ${isActive ? "border-[#111] scale-110" : "border-gray-300"
                          }`}
                        style={getColorSwatchStyle(color.name, color.hexCode)}
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
            const productUrl = product.slug ? `/products/${product.slug}` : `/product/${product.id}`;
            const selectedVariantCode = selectedColor?.productId === product.id
              ? selectedColor.variantCode
              : product.colors?.[0]?.variant?.variantCode;
            const finalUrl = selectedVariantCode ? `${productUrl}?variant=${selectedVariantCode}` : productUrl;

            const currentImage = activeColorImage || product.image || "/placeholder.png";

            const isLarge = gridPos && (gridPos.span.row > 1 || gridPos.span.col > 1);
            const aspectClass = isLarge ? "aspect-square" : "aspect-3/4";

            const totalStock = getProductTotalStock(product);
            const isOutOfStock = totalStock === 0;

            return (
              <div key={product.id} className={`group relative overflow-hidden ${isOutOfStock ? "opacity-75" : ""}`} style={gridStyle}>
                <Link href={finalUrl} className="block relative">
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

                  {!isOutOfStock && (
                    <div className="hidden md:block absolute bottom-4 left-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 p-3">
                        <p className="text-[10px] tracking-[0.2em] font-light text-[#111]/40 uppercase mb-3 text-center">Hızlı ekle</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {(() => {
                            const currentColorObj = selectedColor?.productId === product.id
                              ? product.colors.find((c: any) => Array.isArray(c.images) && c.images[0] === selectedColor.colorImage) || product.colors?.[0]
                              : product.colors?.[0];

                            const availableSizes = product.sizes && product.sizes.length > 0
                              ? product.sizes
                              : product.sizeOptions && product.sizeOptions.length > 0
                                ? product.sizeOptions.map((so: any) => ({ name: so.name, stock: 0, id: so.id }))
                                : [];

                            if (availableSizes.length === 0) {
                              return <p className="text-[10px] text-gray-400">Beden seçeneği yok</p>;
                            }

                            const currentColorId = currentColorObj?.id || product.colors?.[0]?.id;
                            const SIZE_ORDER = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "XXXXL", "4XL"];

                            const inStockSizes = availableSizes
                              .map((size: any) => {
                                const sizeName = typeof size === "string" ? size : size.name;
                                const sizeStock = typeof size === "object" ? size.stock : 0;
                                const sizeId = typeof size === "object" && size.id ? size.id : null;

                                let variantStock = 0;
                                if (currentColorId && currentColorObj?.variants) {
                                  const variant = currentColorObj.variants.find((v: any) =>
                                    v.colorId === currentColorId && v.sizeId === sizeId
                                  );
                                  variantStock = variant?.stock || 0;
                                }

                                const finalStock = variantStock > 0 ? variantStock : sizeStock;
                                return { sizeName, sizeId, finalStock };
                              })
                              .filter((item: any) => item.finalStock > 0)
                              .sort((a: any, b: any) => {
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

                            return inStockSizes.map(({ sizeName, sizeId }: any, sizeIdx: number) => (
                              <button
                                key={sizeIdx}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
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
                                      const result = await res.json();
                                      if (!result.userId && result.product) {
                                        const { addToGuestCart } = await import("@/lib/cart-utils");
                                        addToGuestCart(product.id, currentColorId || null, sizeId || null, 1, {
                                          id: result.product.id,
                                          name: result.product.name || product.name,
                                          image: result.product.image || product.image,
                                          price: result.product.price || product.price || 0,
                                        });
                                      }
                                      const cartModule = await import("@/lib/stores/cartStore");
                                      await cartModule.useCartStore.getState().refreshCart();
                                      window.dispatchEvent(
                                        new CustomEvent("itemAddedToCart", {
                                          detail: {
                                            product: {
                                              id: product.id,
                                              name: product.name,
                                              image: currentColorObj?.images?.[0] || product.primaryImage || product.image || "/placeholder.jpg",
                                              price: product.price,
                                            },
                                            size: sizeName,
                                            color: currentColorObj?.name || "",
                                          },
                                        })
                                      );
                                    } else {
                                      const errorData = await res.json();
                                      toast.error(errorData.error || "Hata oluştu");
                                    }
                                  } catch {
                                    toast.error("Hata oluştu");
                                  }
                                }}
                                className="w-10 h-10 flex items-center justify-center text-[11px] font-light border transition-all duration-300 border-gray-200 text-[#111] hover:bg-black hover:text-white hover:border-black bg-white"
                              >
                                {sizeName}
                              </button>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </Link>

                <div className="space-y-1 text-center">
                  <h3 className="font-light text-[#111] text-xs md:text-sm line-clamp-2 min-h-10 md:min-h-12">
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
                  {Array.from(new Map(product.colors.map((c: any) => [c.id || `${c.name}-${c.images?.[0] || ""}`, c])).values()).map((color: any, idx) => {
                    const colorImg = color.images?.[0] || "";
                    const isActive = isColorActive && activeColorImage === colorImg;
                    return (
                      <button
                        key={idx}
                        onMouseEnter={() => handleColorHover(product.id, colorImg)}
                        onMouseLeave={handleColorLeave}
                        onClick={() => handleColorSelect(product.id, colorImg, color.variant?.variantCode)}
                        className={`w-3 h-3 rounded-full border transition-all duration-200 ${isActive ? "border-[#111]" : "border-gray-300"
                          }`}
                        style={getColorSwatchStyle(color.name, color.hexCode)}
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
