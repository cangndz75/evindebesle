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
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const res = await fetch(`/api/favorites/check?productId=${productId}`);
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      } catch (error) {}
    };
    checkFavorite();
  }, [productId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?productId=${productId}`, { method: "DELETE" });
        setIsFavorite(false);
        toast.success(`${productName} favorilerden çıkarıldı`, { position: "bottom-left" });
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        setIsFavorite(true);
        toast.success(`${productName} favorilere eklendi`, { position: "bottom-left" });
      }
      window.dispatchEvent(new Event("favoriteUpdated"));
    } catch (error) {
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

  const availableOptions = useMemo(() => {
    const sizes = new Set<string>();
    const colors = new Set<string>();
    const fabricTypes = new Set<string>();

    products.forEach((p) => {
      p.colors.forEach((c) => colors.add(c.name));
      if (p.fabricType) fabricTypes.add(p.fabricType);
    });

    return {
      sizes: Array.from(sizes).sort(),
      colors: Array.from(colors).sort(),
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
          <button onClick={() => setSelectedCategory("All")} className={`px-4 py-2 text-xs md:text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap ${selectedCategory === "All" ? "bg-[#111] text-white" : "bg-white text-[#111] border border-[#111]"}`}>TÜMÜ</button>
          {initialCategories.map((cat) => (
            <button key={cat.slug} onClick={() => setSelectedCategory(cat.slug)} className={`px-4 py-2 text-xs md:text-sm font-light uppercase tracking-wide transition-colors whitespace-nowrap ${selectedCategory === cat.slug ? "bg-[#111] text-white" : "bg-white text-[#111] border border-[#111]"}`}>{cat.name}</button>
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
          />
          <div className="flex items-center gap-4">
            <span className="text-xs md:text-sm text-[#111]/60 font-light">{products.length} ürün</span>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px] border-none bg-transparent text-sm font-light focus:ring-0">
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
             const activeImg = hoveredColor?.productId === p.id ? hoveredColor.colorImage : p.image;
             return (
              <div key={p.id} className="group">
                <Link href={`/products/${p.slug}`} className="block">
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
                  <h3 className="font-light text-[#111] text-sm truncate">{p.name}</h3>
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
                        className="w-3 h-3 rounded-full border border-gray-200" 
                        style={{ backgroundColor: c.hexCode || "#000000" }} 
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
