"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import HoverImageSlider from "@/components/product/HoverImageSlider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ProductColor = {
    name: string;
    hexCode?: string;
    images: string[];
};

type ProductSize = {
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
        const nextFavorite = !isFavorite;
        setIsFavorite(nextFavorite);
        setIsLoading(true);
        try {
            if (!nextFavorite) {
                await fetch(`/api/favorites?productId=${productId}`, {
                    method: "DELETE",
                });
                toast.success(`${productName} favorilerden çıkarıldı`, {
                    position: "bottom-left",
                });
            } else {
                await fetch("/api/favorites", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId }),
                });
                toast.success(`${productName} favorilere eklendi`, {
                    position: "bottom-left",
                });
            }
            window.dispatchEvent(new Event("favoriteUpdated"));
        } catch (error) {
            setIsFavorite(!nextFavorite);
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

type CategoryProductsPageProps = {
    categoryName: string;
    categorySlug: string;
    gender?: string;
    initialProducts?: Product[];
    initialPriceRange?: { min: number; max: number };
};

export default function CategoryProductsPage({
    categoryName,
    categorySlug,
    gender,
    initialProducts = [],
    initialPriceRange = { min: 0, max: 2000 },
}: CategoryProductsPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

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
    const [hoveredColor, setHoveredColor] = useState<{
        productId: string;
        colorImage: string;
    } | null>(null);
    const [selectedColor, setSelectedColor] = useState<{
        productId: string;
        colorImage: string;
        variantCode?: string;
    } | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (initialPriceRange.min !== 0 || initialPriceRange.max !== 2000) {
            setPriceRange(initialPriceRange);
        }
    }, [initialPriceRange]);

    useEffect(() => {
        const sizes = searchParams.getAll("size");
        const colors = searchParams.getAll("color");
        const fabricTypes = searchParams.getAll("fabricType");
        const minPriceRaw = searchParams.get("minPrice");
        const maxPriceRaw = searchParams.get("maxPrice");
        const sortRaw = searchParams.get("sort");

        const parsedMin = minPriceRaw ? Number(minPriceRaw) : undefined;
        const parsedMax = maxPriceRaw ? Number(maxPriceRaw) : undefined;

        setFilters({
            sizes,
            colors,
            fabricTypes,
            minPrice: Number.isFinite(parsedMin) ? parsedMin : undefined,
            maxPrice: Number.isFinite(parsedMax) ? parsedMax : undefined,
        });

        if (sortRaw) setSortOption(sortRaw);
    }, [searchParams]);

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

    const buildApiUrl = useCallback(() => {
        const hasFilters =
            debouncedFilters.minPrice ||
            debouncedFilters.maxPrice ||
            debouncedFilters.sizes.length > 0 ||
            debouncedFilters.colors.length > 0 ||
            debouncedFilters.fabricTypes.length > 0;

        if (!hasFilters && initialProducts.length > 0) {
            return null; // Use initial products
        }

        const params = new URLSearchParams();
        params.append("categorySlug", categorySlug);
        if (gender) {
            params.append("gender", gender);
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

        return `/api/products?${params.toString()}`;
    }, [categorySlug, gender, debouncedFilters, initialProducts]);

    const apiUrl = buildApiUrl();

    const { data: fetchedProducts, error, isLoading: swrLoading } = useSWR<Product[]>(
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

    useEffect(() => {
        const params = new URLSearchParams();

        if (debouncedFilters.minPrice != null) params.set("minPrice", String(debouncedFilters.minPrice));
        if (debouncedFilters.maxPrice != null) params.set("maxPrice", String(debouncedFilters.maxPrice));
        debouncedFilters.sizes.forEach((size) => params.append("size", size));
        debouncedFilters.colors.forEach((color) => params.append("color", color));
        debouncedFilters.fabricTypes.forEach((fabricType) => params.append("fabricType", fabricType));
        if (sortOption && sortOption !== "featured") params.set("sort", sortOption);

        const query = params.toString();
        const nextUrl = query ? `${pathname}?${query}` : pathname;
        router.replace(nextUrl, { scroll: false });
    }, [debouncedFilters, sortOption, pathname, router]);

    const availableOptions = useMemo(() => {
        const sizes = new Set<string>();
        const colors = new Map<string, { name: string; hexCode?: string }>();
        const fabricTypes = new Set<string>();
        let minPrice = Infinity;
        let maxPrice = 0;

        products.forEach((product) => {
            product.sizes.forEach((s) => sizes.add(s.name));
            product.colors.forEach((c) => {
                const key = normalizeColorKey(c.name);
                if (!colors.has(key)) {
                    colors.set(key, {
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
            colors: Array.from(colors.values()).sort((a, b) => a.name.localeCompare(b.name)),
            fabricTypes: Array.from(fabricTypes).sort(),
            priceRange: {
                min: minPrice === Infinity ? 0 : Math.floor(minPrice),
                max: maxPrice === 0 ? 2000 : Math.ceil(maxPrice),
            },
        };
    }, [products]);

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
            minPrice: undefined,
            maxPrice: undefined,
        });
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                {/* Breadcrumb */}
                <nav className="mb-4">
                    <Link
                        href="/"
                        className="text-sm text-[#111]/60 font-light hover:text-[#111]"
                    >
                        Ana Sayfa
                    </Link>
                    <span className="text-sm text-[#111]/60 font-light mx-2">/</span>
                    <span className="text-sm text-[#111] font-light">{categoryName}</span>
                </nav>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#111] mb-6">
                    {categoryName}
                </h1>

                {/* Filter and Sort */}
                <div className="flex items-center justify-between mb-8 gap-4">
                    {/* Filtre Butonu - Sol */}
                    <div className="flex items-center gap-2">
                        <ProductFilters
                            availableSizes={availableOptions.sizes}
                            availableColors={availableOptions.colors}
                            availableFabricTypes={availableOptions.fabricTypes}
                            priceRange={priceRange}
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                            activeFilters={activeFilters}
                            onRemoveFilter={handleRemoveFilter}
                            onClearFilters={handleClearFilters}
                            resultCount={products.length}
                            isLoading={loading}
                        />
                    </div>

                    {/* Sırala - Sağ */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[#111]/60 font-light hidden md:inline">
                            {products.length} ürün
                        </span>

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

                {/* Product Grid */}
                {loading ? (
                    <div className="text-center py-12">Yükleniyor...</div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12 text-[#111]/60">
                        Ürün bulunamadı
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map((product) => {
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

                            const totalStock = product.sizes?.reduce((sum, s) => sum + (s.stock || 0), 0) || 0;
                            const isOutOfStock = totalStock === 0;

                            return (
                                <div key={product.id} className={`group relative overflow-hidden ${isOutOfStock ? "opacity-75" : ""}`}>
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
                                    </Link>

                                    <div className="mt-4 text-center">
                                        <h3 className="text-sm md:text-base font-light text-[#111] mb-1">
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

                                    {/* Renk Seçenekleri */}
                                    {product.colors.length > 0 && (
                                        <div className="flex items-center justify-center gap-1.5 mt-2">
                                            {Array.from(new Map(product.colors.filter((c: any) => c.images?.[0]).map((c: any) => [c.hexCode || c.name, c])).values()).map((color: any, idx: number) => {
                                                const isSelected = selectedColor?.productId === product.id &&
                                                    product.colors.find((c: any) => Array.isArray(c.images) && c.images.length > 0 && c.images[0] === selectedColor.colorImage)?.name === color.name;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onMouseEnter={() =>
                                                            setHoveredColor({
                                                                productId: product.id,
                                                                colorImage: (Array.isArray(color.images) && color.images.length > 0 ? color.images[0] : null) || currentImage
                                                            })
                                                        }
                                                        onMouseLeave={() => setHoveredColor(null)}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setSelectedColor({
                                                                productId: product.id,
                                                                colorImage: (Array.isArray(color.images) && color.images.length > 0 ? color.images[0] : null) || currentImage,
                                                                variantCode: color.variant?.variantCode
                                                            });
                                                        }}
                                                        className={`w-4 h-4 rounded-full border transition-all duration-200 hover:scale-110 ${isSelected
                                                            ? "border-[#111] scale-110"
                                                            : "border-gray-300"
                                                            }`}
                                                        style={{
                                                            backgroundColor: color.hexCode || "#ccc",
                                                        }}
                                                        aria-label={`${color.name} renk seçeneği`}
                                                    />
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
