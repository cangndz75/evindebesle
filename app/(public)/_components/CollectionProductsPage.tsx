"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Heart, ChevronDown, ArrowUpDown, Filter } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import { useFavoritesStore } from "@/lib/stores/favoritesStore";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { resolveSwatchHex } from "@/lib/color-swatch";

type ProductColor = {
  name: string;
  hexCode?: string;
  images: string[];
};

type ProductSize = {
  name: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  hoverImage?: string;
  colors: ProductColor[];
  inColors?: number;
  badge?: string;
  fabricType?: string;
};

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

function normalizeColorKey(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

type CategoryBasic = {
  name: string;
  slug: string;
};

type CollectionProductsPageProps = {
  initialProducts?: Product[];
  initialPriceRange?: { min: number; max: number };
  initialCategories?: CategoryBasic[];
};

function FavoriteButton({ productId, productName }: { productId: string; productName: string }) {
  const isFavorite = useFavoritesStore((s) => s.favoriteIds.has(productId));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      await toggleFav(productId);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center transition-all hover:scale-110 z-10 disabled:opacity-50 shadow-sm"
      onClick={handleToggle}
      disabled={isLoading}
    >
      <Heart className={`w-4 h-4 transition-colors ${isFavorite ? "fill-[#111] text-[#111]" : "text-[#111]"}`} />
    </button>
  );
}

export default function CollectionProductsPage({
  initialProducts = [],
  initialPriceRange = { min: 0, max: 2000 },
  initialCategories = [],
}: CollectionProductsPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hydrateRef = useRef(false);
  useEffect(() => {
    if (hydrateRef.current) return;
    hydrateRef.current = true;
    useFavoritesStore.getState().hydrate();
  }, []);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sizes: [],
    colors: [],
    fabricTypes: [],
  });
  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(filters);
  const [sortOption, setSortOption] = useState("featured");
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<{ productId: string; colorImage: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ productId: string; colorImage: string } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const category = searchParams.get("category") || "All";
    const sizes = searchParams.getAll("size");
    const colors = searchParams.getAll("color");
    const minPriceRaw = searchParams.get("minPrice");
    const maxPriceRaw = searchParams.get("maxPrice");
    const sortRaw = searchParams.get("sort");

    const parsedMin = minPriceRaw ? Number(minPriceRaw) : undefined;
    const parsedMax = maxPriceRaw ? Number(maxPriceRaw) : undefined;

    setSelectedCategory(category);
    setFilters({
      sizes,
      colors,
      fabricTypes: [],
      minPrice: Number.isFinite(parsedMin) ? parsedMin : undefined,
      maxPrice: Number.isFinite(parsedMax) ? parsedMax : undefined,
    });
    if (sortRaw) setSortOption(sortRaw);
  }, [searchParams]);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [filters]);

  const fetcher = useCallback(async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }, []);

  const prefetchCategoryProducts = useCallback((categorySlug: string) => {
    const params = new URLSearchParams();
    params.append("inCollections", "true");

    if (categorySlug !== "All") params.append("categorySlug", categorySlug);
    if (debouncedFilters.minPrice) params.append("minPrice", debouncedFilters.minPrice.toString());
    if (debouncedFilters.maxPrice) params.append("maxPrice", debouncedFilters.maxPrice.toString());
    debouncedFilters.sizes.forEach((s) => params.append("size", s));
    debouncedFilters.colors.forEach((c) => params.append("color", c));
    if (sortOption !== "featured") params.append("sort", sortOption);

    void fetch(`/api/products?${params.toString()}`, {
      method: "GET",
      cache: "force-cache",
    }).catch(() => undefined);
  }, [debouncedFilters, sortOption]);

  const prefetchProductRoute = useCallback((href: string) => {
    router.prefetch(href);
  }, [router]);

  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append("inCollections", "true");

    if (selectedCategory !== "All") params.append("categorySlug", selectedCategory);
    if (debouncedFilters.minPrice) params.append("minPrice", debouncedFilters.minPrice.toString());
    if (debouncedFilters.maxPrice) params.append("maxPrice", debouncedFilters.maxPrice.toString());
    debouncedFilters.sizes.forEach((s) => params.append("size", s));
    debouncedFilters.colors.forEach((c) => params.append("color", c));
    if (sortOption !== "featured") params.append("sort", sortOption);

    return `/api/products?${params.toString()}`;
  }, [selectedCategory, debouncedFilters, sortOption]);

  const apiUrl = buildApiUrl();
  const { data: fetchedProducts, isLoading: swrLoading } = useSWR<Product[]>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });

  useEffect(() => {
    if (fetchedProducts) setProducts(fetchedProducts);
  }, [fetchedProducts]);

  useEffect(() => { setLoading(swrLoading); }, [swrLoading]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    if (debouncedFilters.minPrice != null) params.set("minPrice", String(debouncedFilters.minPrice));
    if (debouncedFilters.maxPrice != null) params.set("maxPrice", String(debouncedFilters.maxPrice));
    debouncedFilters.sizes.forEach((size) => params.append("size", size));
    debouncedFilters.colors.forEach((color) => params.append("color", color));
    if (sortOption && sortOption !== "featured") params.set("sort", sortOption);

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [selectedCategory, debouncedFilters, sortOption, pathname, router]);

  const availableOptions = useMemo(() => {
    const sizes = new Set<string>();
    const colors = new Map<string, { name: string; hexCode?: string }>();
    const fabricTypes = new Set<string>();

    products.forEach((p) => {
      p.colors.forEach((c) => {
        const key = normalizeColorKey(c.name);
        if (!colors.has(key)) {
          colors.set(key, {
            name: c.name.trim(),
            hexCode: c.hexCode,
          });
        }
      });
      if (p.fabricType) fabricTypes.add(p.fabricType);
    });

    return {
      sizes: Array.from(sizes).sort(),
      colors: Array.from(colors.values()).sort((a, b) => a.name.localeCompare(b.name)),
      fabricTypes: Array.from(fabricTypes).sort(),
      priceRange: initialPriceRange,
    };
  }, [products, initialPriceRange]);

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const res: ActiveFilter[] = [];
    if (filters.minPrice || filters.maxPrice) {
      res.push({
        type: "price",
        label: filters.minPrice && filters.maxPrice ? `₺${filters.minPrice} - ₺${filters.maxPrice}` : filters.minPrice ? `₺${filters.minPrice}+` : `₺${filters.maxPrice}-`,
        value: `${filters.minPrice || ""}-${filters.maxPrice || ""}`,
      });
    }
    filters.sizes.forEach((s) => res.push({ type: "size", label: s, value: s }));
    filters.colors.forEach((c) => res.push({ type: "color", label: c, value: c }));
    return res;
  }, [filters]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12 pt-24">
        <nav className="mb-4">
          <Link href="/" className="text-xs md:text-sm text-[#111]/60 font-light hover:text-[#111]">Ana Sayfa</Link>
          <span className="text-xs md:text-sm text-[#111]/60 font-light mx-2">/</span>
          <Link href="/collections" className="text-xs md:text-sm text-[#111]/60 font-light hover:text-[#111]">Koleksiyonlar</Link>
          <span className="text-xs md:text-sm text-[#111]/60 font-light mx-2">/</span>
          <span className="text-xs md:text-sm text-[#111] font-light">Tümü</span>
        </nav>

        <h1 className="text-2xl md:text-4xl lg:text-5xl font-light text-[#111] mb-6">Tüm Koleksiyonlar</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <button onMouseEnter={() => prefetchCategoryProducts("All")} onClick={() => setSelectedCategory("All")} className={`px-4 py-2 text-xs md:text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap ${selectedCategory === "All" ? "bg-[#111] text-white" : "bg-white text-[#111] border border-[#111]"}`}>TÜMÜ</button>
          {initialCategories.map((cat) => (
            <button key={cat.slug} onMouseEnter={() => prefetchCategoryProducts(cat.slug)} onClick={() => setSelectedCategory(cat.slug)} className={`px-4 py-2 text-xs md:text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap ${selectedCategory === cat.slug ? "bg-[#111] text-white" : "bg-white text-[#111] border border-[#111]"}`}>{cat.name}</button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-8">
          <ProductFilters
            availableSizes={availableOptions.sizes}
            availableColors={availableOptions.colors}
            availableFabricTypes={availableOptions.fabricTypes}
            priceRange={availableOptions.priceRange}
            filters={filters}
            onFiltersChange={setFilters}
            activeFilters={activeFilters}
            onRemoveFilter={(f) => {
              const nf = { ...filters };
              if (f.type === "price") { nf.minPrice = undefined; nf.maxPrice = undefined; }
              else if (f.type === "size") nf.sizes = nf.sizes.filter(s => s !== f.value);
              else if (f.type === "color") nf.colors = nf.colors.filter(c => c !== f.value);
              setFilters(nf);
            }}
            onClearFilters={() => setFilters({ sizes: [], colors: [], fabricTypes: [] })}
            resultCount={products.length}
            isLoading={loading}
          />
          <div className="flex items-center gap-4">
            <span className="text-xs md:text-sm text-[#111]/60 font-light">{products.length} ürün</span>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-45 border-none bg-transparent text-sm font-light focus:ring-0">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Öne çıkan</SelectItem>
                <SelectItem value="price-low">Fiyat: Düşükten Yükseğe</SelectItem>
                <SelectItem value="price-high">Fiyat: Yüksekten Düşüğe</SelectItem>
                <SelectItem value="date-new">En Yeniler</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => {
             const activeImg = hoveredColor?.productId === p.id
               ? hoveredColor.colorImage
               : selectedColor?.productId === p.id
                 ? selectedColor.colorImage
                 : p.image;
             const productHref = p.slug ? `/products/${p.slug}` : `/product/${p.id}`;
             return (
              <div key={p.id} className="group">
                <Link href={productHref} prefetch={true} onMouseEnter={() => prefetchProductRoute(productHref)} className="block">
                  <HoverImageSlider
                    images={[activeImg || "/placeholder.png", p.hoverImage].filter(Boolean) as string[]}
                    alt={p.name}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="mb-3"
                    badge={p.badge ? <div className="absolute top-3 left-3 bg-[#111] text-white text-[10px] px-2 py-1 uppercase">{p.badge}</div> : null}
                    favoriteButton={<FavoriteButton productId={p.id} productName={p.name} />}
                  />
                </Link>
                <div className="space-y-1">
                  <h3 className="font-light text-[#111] text-sm line-clamp-2 min-h-10 md:min-h-12">{p.name}</h3>
                  <div className="flex gap-2 items-center">
                    <span className="font-light text-[#111] text-sm">{p.originalPrice && p.originalPrice > p.price ? p.price : p.price} ₺</span>
                    {p.originalPrice && p.originalPrice > p.price && <span className="text-[#111]/40 line-through text-xs font-light">{p.originalPrice} ₺</span>}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {p.colors.map((c, idx) => (
                      <button
                        key={idx}
                        onMouseEnter={() => setHoveredColor({ productId: p.id, colorImage: c.images[0] })}
                        onMouseLeave={() => setHoveredColor(null)}
                        onClick={() => setSelectedColor({ productId: p.id, colorImage: c.images[0] })}
                        className={`w-3 h-3 rounded-full border transition-all duration-200 ${selectedColor?.productId === p.id && selectedColor.colorImage === c.images[0] ? "border-[#111] scale-110" : "border-gray-200"}`}
                        style={{ backgroundColor: resolveSwatchHex({ name: c.name, hexCode: c.hexCode }) }}
                        aria-label={`${c.name} renk seçeneği`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
