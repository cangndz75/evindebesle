"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Heart, ChevronDown, ShoppingBag, Filter, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import ProductFilters from "./ProductFilters";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import HoverImageSlider from "@/components/product/HoverImageSlider";

type ProductColor = {
  name: string;
  hexCode?: string;
  images: string[];
};

type ProductSize = {
  id?: string;
  name: string;
  stock: number;
};

type ProductTag = {
  name: string;
};

type ProductVariant = {
  id: string;
  variantCode: string;
  colorId: string | null;
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
  gender?: "MALE" | "FEMALE" | "UNISEX";
  fabricType?: string;
  colors: (ProductColor & { variant?: ProductVariant; id?: string; variants?: any[] })[];
  sizes: ProductSize[];
  sizeOptions?: Array<{ name: string; isActive: boolean }>;
  tags: ProductTag[];
};

function getProductTotalStock(product: Product): number {
  const variants = product.colors?.flatMap((color) => color.variants ?? []) ?? [];
  const variantStockTotal = variants.reduce((sum, variant) => sum + (Number(variant?.stock) || 0), 0);
  const sizeStockTotal = product.sizes?.reduce((sum, size) => sum + (Number(size.stock) || 0), 0) || 0;

  return Math.max(variantStockTotal, sizeStockTotal);
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

type MenProductsPageProps = {
  initialProducts?: Product[];
  initialPriceRange?: { min: number; max: number };
  initialCategories?: CategoryBasic[];
  initialSelectedCategory?: string;
  pageTitle?: string;
  breadcrumbCurrent?: string;
  baseQuery?: BaseQuery;
  hideCategoryFilters?: boolean;
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

export default function MenProductsPage({
  initialProducts = [],
  initialPriceRange = { min: 0, max: 2000 },
  initialCategories = [],
  initialSelectedCategory = "All",
  pageTitle = "Erkek",
  breadcrumbCurrent = "Erkek",
  baseQuery,
  hideCategoryFilters = false,
}: MenProductsPageProps = {}) {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(initialSelectedCategory);
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
  const [hoveredColor, setHoveredColor] = useState<{
    productId: string;
    colorImage: string;
  } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{
    productId: string;
    colorImage: string;
    variantCode?: string;
  } | null>(null);
  useEffect(() => {
    if (initialPriceRange.min !== 0 || initialPriceRange.max !== 2000) {
      setPriceRange(initialPriceRange);
    }
  }, [initialPriceRange]);

  useEffect(() => {
    const categoryFromQuery = searchParams.get("category");
    if (!categoryFromQuery) {
      setSelectedCategory(initialSelectedCategory);
      return;
    }

    const hasCategory = initialCategories.some((category) => category.slug === categoryFromQuery);
    setSelectedCategory(hasCategory ? categoryFromQuery : "All");
  }, [searchParams, initialCategories, initialSelectedCategory]);

  const fetcher = useCallback(async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }, []);

  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append("gender", "MALE");
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
  }, [selectedCategory, filters, sortOption, baseQuery]);

  const apiUrl = buildApiUrl();

  const { data: fetchedProducts, error, isLoading: swrLoading } = useSWR<Product[]>(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // 2 saniye içinde aynı request'i tekrar etme
      fallbackData: initialProducts.length > 0 && !apiUrl ? initialProducts : undefined,
      keepPreviousData: true,
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
    let minPrice = Infinity;
    let maxPrice = 0;

    const optionsSource = initialProducts.length > 0 ? initialProducts : products;

    optionsSource.forEach((product) => {
      product.sizes.forEach((s) => sizes.add(s.name));
      product.colors.forEach((c) => {
        const normalized = normalizeColorName(c.name);
        if (!colors.has(normalized)) {
          colors.set(normalized, {
            name: c.name.trim(),
            hexCode: c.hexCode,
          });
        }
      });
      if (product.fabricType) {
        fabricTypes.add(product.fabricType);
      }
      if (product.price < minPrice) minPrice = product.price;
      if (product.price > maxPrice) maxPrice = product.price;
    });

    return {
      sizes: Array.from(sizes).sort(),
      colors: Array.from(colors.values())
        .sort((a, b) => a.name.localeCompare(b.name)),
      fabricTypes: Array.from(fabricTypes).sort(),
      priceRange: {
        min: minPrice === Infinity ? 0 : Math.floor(minPrice),
        max: maxPrice === 0 ? 2000 : Math.ceil(maxPrice),
      },
    };
  }, [initialProducts, products]);

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

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const result: ActiveFilter[] = [];

    if (filters.minPrice || filters.maxPrice) {
      const label =
        filters.minPrice && filters.maxPrice
          ? `₺${filters.minPrice} - ₺${filters.maxPrice}`
          : filters.minPrice
            ? `₺${filters.minPrice}+`
            : `₺${filters.maxPrice}-`;
      result.push({
        type: "price",
        label,
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
      minPrice: undefined,
      maxPrice: undefined,
    };
    setFilters(clearedFilters);
    setPendingFilters(clearedFilters);
  };

  const handleColorClick = (productId: string, color: Product['colors'][number], e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const colorImage = (Array.isArray(color.images) && color.images.length > 0) ? color.images[0] : "";
    const variantCode = color.variant?.variantCode;
    setSelectedColor({ productId, colorImage, variantCode });
  };

  const handleColorHover = (productId: string, colorImage: string) => {
    setHoveredColor({ productId, colorImage });
  };

  const handleColorLeave = () => {
    setHoveredColor(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        
        <nav className="mb-4">
          <Link
            href="/"
            className="text-sm text-[#111]/60 font-light hover:text-[#111]"
          >
            Ana Sayfa
          </Link>
          <span className="text-sm text-[#111]/60 font-light mx-2">/</span>
          <span className="text-sm text-[#111] font-light">{breadcrumbCurrent}</span>
        </nav>

        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#111] mb-6">
          {pageTitle}
        </h1>

        
        {!hideCategoryFilters && (
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap shrink-0 ${
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
              onClick={() => setSelectedCategory(category.slug)}
              className={`px-4 py-2 text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap shrink-0 ${selectedCategory === category.slug
                ? "bg-[#111] text-white"
                : "bg-white text-[#111] border border-[#111] hover:bg-[#111] hover:text-white"
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        )}

        
        <div className="flex items-center justify-between mb-8 gap-4">
          
          <div className="flex items-center gap-2">
            <ProductFilters
              availableSizes={availableOptions.sizes}
              availableColors={availableOptions.colors}
              availableFabricTypes={availableOptions.fabricTypes}
              priceRange={priceRange}
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

          
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#111]/60 font-light hidden md:inline">
              {products.length} ürün
            </span>

            
            <button
              onClick={() => setSortDialogOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 text-sm font-light text-[#111] border border-[#111] hover:bg-[#111] hover:text-white transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
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
                <RadioGroupItem value="featured" id="featured" />
                <Label htmlFor="featured" className="flex-1 cursor-pointer font-normal">
                  Öne çıkan
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="bestseller" id="bestseller" />
                <Label htmlFor="bestseller" className="flex-1 cursor-pointer font-normal">
                  En çok satan
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="az" id="az" />
                <Label htmlFor="az" className="flex-1 cursor-pointer font-normal">
                  Alfabetik olarak, A-Z
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="za" id="za" />
                <Label htmlFor="za" className="flex-1 cursor-pointer font-normal">
                  Alfabetik olarak, Z-A
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="price-low" id="price-low" />
                <Label htmlFor="price-low" className="flex-1 cursor-pointer font-normal">
                  Fiyat, düşükten yükseğe
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="price-high" id="price-high" />
                <Label htmlFor="price-high" className="flex-1 cursor-pointer font-normal">
                  Fiyat, yüksekten düşüğe
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3 border-b">
                <RadioGroupItem value="date-old" id="date-old" />
                <Label htmlFor="date-old" className="flex-1 cursor-pointer font-normal">
                  Tarih, eskiden yeniye
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-3">
                <RadioGroupItem value="date-new" id="date-new" />
                <Label htmlFor="date-new" className="flex-1 cursor-pointer font-normal">
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

        
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx}>
                <Skeleton className="aspect-3/4 w-full mb-4" />
                <Skeleton className="h-4 w-4/5 mx-auto mb-2" />
                <Skeleton className="h-4 w-1/3 mx-auto" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-[#111]/60">
            Ürün bulunamadı
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, index) => {
              const pos = index % 18;
              let gridClass = "col-span-1";
              
              if (pos === 0) {
                gridClass = "col-span-1 md:col-span-2 md:row-span-2";
              } else if (pos === 11) {
                gridClass = "col-span-1 md:col-span-2 md:row-span-2";
              } else {
                gridClass = "col-span-1";
              }

              const defaultColor = product.colors?.[0];

              const selectedColorForProduct = selectedColor?.productId === product.id && product.colors
                ? product.colors.find(c => c.images?.[0] === selectedColor.colorImage)
                : null;

              const activeColorObj = selectedColorForProduct || defaultColor;

              const hoveredColorObj = hoveredColor?.productId === product.id && product.colors
                ? product.colors.find(c => c.images?.[0] === hoveredColor.colorImage)
                : null;

              const displayColorObj = hoveredColorObj || activeColorObj;

              const currentImage =
                (displayColorObj?.images && Array.isArray(displayColorObj.images) && displayColorObj.images.length > 0 ? displayColorObj.images[0] : null) ||
                product.primaryImage ||
                product.image ||
                "/placeholder.jpg";

              const hasMultipleImages = displayColorObj?.images && Array.isArray(displayColorObj.images) && displayColorObj.images.length > 1;
              const hoverImage = hasMultipleImages
                ? (Array.isArray(displayColorObj.images) && displayColorObj.images.length > 1 ? displayColorObj.images[1] : null)
                : product.secondaryImage ||
                (defaultColor?.images && Array.isArray(defaultColor.images) && defaultColor.images.length > 1 ? defaultColor.images[1] : null) ||
                product.primaryImage ||
                currentImage;

              const productUrl = product.slug
                ? `/products/${product.slug}`
                : `/product/${product.id}`;

              const variant = selectedColor?.productId === product.id
                ? selectedColor.variantCode
                : product.colors?.[0]?.variant?.variantCode;
              const finalUrl = variant ? `${productUrl}?variant=${variant}` : productUrl;

              const totalStock = getProductTotalStock(product);
              const isOutOfStock = totalStock === 0;

              return (
                <div key={`${product.id}-${index}`} className={`group relative overflow-hidden ${gridClass} ${isOutOfStock ? "opacity-75" : ""}`}>
                  <Link href={finalUrl} prefetch={true} className="block relative">
                    <HoverImageSlider
                      images={
                        displayColorObj?.images && Array.isArray(displayColorObj.images) && displayColorObj.images.length > 0
                          ? displayColorObj.images
                          : [product.primaryImage || product.image || "/placeholder.jpg", product.secondaryImage].filter(Boolean) as string[]
                      }
                      alt={product.name}
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="mb-4"
                      badge={product.originalPrice && product.originalPrice > product.price ? "İndirim" : null}
                      favoriteButton={<FavoriteButton productId={product.id} productName={product.name} />}
                      isOutOfStock={isOutOfStock}
                    />

                    {!isOutOfStock && (
                    <div className="hidden md:block absolute bottom-4 left-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 p-3">
                        <p className="text-[10px] tracking-[0.2em] font-light text-[#111]/40 uppercase mb-3 text-center">Hızlı ekle</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {(() => {
                            const availableSizes = product.sizes && product.sizes.length > 0
                              ? product.sizes
                              : product.sizeOptions && product.sizeOptions.length > 0
                                ? product.sizeOptions.map((so: any) => ({ name: so.name, stock: 0, id: so.id }))
                                : [];

                            if (availableSizes.length === 0) {
                              return <p className="text-[10px] text-gray-400">Beden seçeneği yok</p>;
                            }

                            const currentColorId = displayColorObj?.id || product.colors?.[0]?.id;
                            const SIZE_ORDER = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "XXXXL", "4XL"];

                            const inStockSizes = availableSizes.map((size: any) => {
                              const sizeName = typeof size === 'string' ? size : size.name;
                              const sizeStock = typeof size === 'object' ? size.stock : 0;
                              const rawSizeId = typeof size === 'object' && size.id ? size.id : null;
                              const matchedSizeId = Array.isArray(product.sizes)
                                ? product.sizes.find((s: any) => typeof s === 'object' && s?.name === sizeName && s?.id)?.id
                                : null;
                              const sizeId = rawSizeId || matchedSizeId || null;

                              let finalStock = sizeStock;
                              if (currentColorId && displayColorObj?.variants && Array.isArray(displayColorObj.variants) && displayColorObj.variants.length > 0) {
                                const exactVariant = displayColorObj.variants.find((v: any) =>
                                  v.colorId === currentColorId && v.sizeId === sizeId
                                );

                                if (exactVariant) {
                                  finalStock = exactVariant.stock || 0;
                                } else {
                                  const hasSizedVariantsForColor = displayColorObj.variants.some((v: any) =>
                                    v.colorId === currentColorId && !!v.sizeId
                                  );
                                  const colorLevelVariant = displayColorObj.variants.find((v: any) =>
                                    v.colorId === currentColorId && !v.sizeId
                                  );

                                  if (hasSizedVariantsForColor) {
                                    finalStock = 0;
                                  } else if (colorLevelVariant) {
                                    finalStock = colorLevelVariant.stock || 0;
                                  }
                                }
                              }
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
                                      toast.error("Stokta yok");
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
                                          const result = await res.json();
                                          if (!result.userId && result.product) {
                                              const { addToGuestCart } = await import("@/lib/cart-utils");
                                              addToGuestCart(product.id, currentColorId || null, sizeId || null, 1, {
                                                  id: result.product.id,
                                                  name: result.product.name || product.name,
                                                image: displayColorObj?.images?.[0] || result.product.image || product.primaryImage || product.image,
                                                  price: result.product.price || product.price || 0,
                                              }, {
                                                id: currentColorId || "",
                                                name: displayColorObj?.name || "",
                                              }, {
                                                id: sizeId || "",
                                                name: sizeName || "",
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
                                                  image: displayColorObj?.images?.[0] || product.primaryImage || product.image || "/placeholder.jpg",
                                                  price: product.price,
                                                },
                                                size: sizeName,
                                                color: displayColorObj?.name || "",
                                              },
                                            })
                                          );
                                      } else {
                                          const errorData = await res.json();
                                          toast.error(errorData.error || "Hata oluştu");
                                      }
                                    } catch (error) {
                                      toast.error("Hata oluştu");
                                    }
                                  }}
                                  disabled={isOutOfStock}
                                  className={`w-10 h-10 flex items-center justify-center text-[11px] font-light border transition-all duration-300 ${
                                    isOutOfStock 
                                      ? "border-gray-100 text-gray-300 cursor-not-allowed bg-white" 
                                      : "border-gray-200 text-[#111] hover:bg-black hover:text-white hover:border-black bg-white"
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
                    )}
                  </Link>

                  <div className="mb-2 text-center">
                    <h3 className="text-sm md:text-base font-light text-[#111] mb-1 line-clamp-2 min-h-12">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2">
                      {product.originalPrice && product.originalPrice > product.price ? (
                        <>
                          <span className="text-sm md:text-base font-light text-[#111]">
                            {product.price.toFixed(2)} ₺
                          </span>
                          <span className="text-sm text-[#111]/60 line-through">
                            {product.originalPrice.toFixed(2)} ₺
                          </span>
                        </>
                      ) : (
                        <span className="text-sm md:text-base font-light text-[#111]">
                          {product.price.toFixed(2)} ₺
                        </span>
                      )}
                    </div>
                  </div>

                  
                  {product.colors.length > 0 && (
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      {Array.from(new Map(product.colors.map((c: any) => [c.id || `${c.name}-${c.images?.[0] || ""}`, c])).values()).map((color: any, idx) => {
                        const colorImage = (Array.isArray(color.images) && color.images.length > 0 ? color.images[0] : null) || currentImage;
                        const isSelected = selectedColor?.productId === product.id && selectedColor.colorImage === colorImage;
                        return (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <button
                                onMouseEnter={() =>
                                  handleColorHover(product.id, colorImage)
                                }
                                onMouseLeave={handleColorLeave}
                                onClick={(e) => handleColorClick(product.id, color, e)}
                                className={`w-4 h-4 rounded-full border transition-all duration-200 hover:scale-110 ${isSelected
                                  ? "border-[#111] scale-110"
                                  : "border-gray-300"
                                  }`}
                                style={getColorSwatchStyle(color.name, color.hexCode)}
                                aria-label={`${color.name} renk seçeneği`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="capitalize">{color.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
