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

function FavoriteButton({ productId, productName }: { productId: string; productName: string }) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Favori durumunu kontrol et
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
            // Header'daki favori sayısını güncellemek için event dispatch et
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

    // Fiyat aralığı zaten server-side'da çekildi, sadece güncelleme gerekirse
    useEffect(() => {
        if (initialPriceRange.min !== 0 || initialPriceRange.max !== 2000) {
            setPriceRange(initialPriceRange);
        }
    }, [initialPriceRange]);

    // Debounce filters - 300ms gecikme ile
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

    // SWR için fetcher function
    const fetcher = useCallback(async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
    }, []);

    // Build API URL with filters (debounced filters kullan)
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

    // SWR ile data fetching
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

    // Products state'i güncelle
    useEffect(() => {
        if (fetchedProducts) {
            setProducts(fetchedProducts);
        } else if (!apiUrl && initialProducts.length > 0) {
            setProducts(initialProducts);
        }
    }, [fetchedProducts, apiUrl, initialProducts]);

    // Loading state
    useEffect(() => {
        setLoading(swrLoading);
    }, [swrLoading]);

    // Extract available options from products
    const availableOptions = useMemo(() => {
        const sizes = new Set<string>();
        const colors = new Set<string>();
        const fabricTypes = new Set<string>();
        let minPrice = Infinity;
        let maxPrice = 0;

        products.forEach((product) => {
            product.sizes.forEach((s) => sizes.add(s.name));
            product.colors.forEach((c) => colors.add(c.name));
            if (product.fabricType) {
                fabricTypes.add(product.fabricType);
            }
            if (product.price < minPrice) minPrice = product.price;
            if (product.price > maxPrice) maxPrice = product.price;
        });

        return {
            sizes: Array.from(sizes).sort(),
            colors: Array.from(colors).sort(),
            fabricTypes: Array.from(fabricTypes).sort(),
            priceRange: {
                min: minPrice === Infinity ? 0 : Math.floor(minPrice),
                max: maxPrice === 0 ? 2000 : Math.ceil(maxPrice),
            },
        };
    }, [products]);

    // Active filters for display
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
                            // İlk açılışta ana renk (ilk renk) göster
                            const defaultColor = product.colors?.[0];

                            // Seçili renk varsa onu kullan, yoksa ana renk
                            const selectedColorForProduct = selectedColor?.productId === product.id && product.colors
                                ? product.colors.find(c => c.images?.[0] === selectedColor.colorImage)
                                : null;

                            // Aktif renk: seçili renk veya ana renk
                            const activeColorObj = selectedColorForProduct || defaultColor;

                            // Hover durumunda hover'daki renk, yoksa aktif renk
                            const hoveredColorObj = hoveredColor?.productId === product.id && product.colors
                                ? product.colors.find(c => c.images?.[0] === hoveredColor.colorImage)
                                : null;

                            // Görüntülenecek renk: hover varsa hover, yoksa aktif renk
                            const displayColorObj = hoveredColorObj || activeColorObj;

                            // Ana görsel: aktif renge göre
                            const currentImage =
                                (displayColorObj?.images && Array.isArray(displayColorObj.images) && displayColorObj.images.length > 0 ? displayColorObj.images[0] : null) ||
                                product.primaryImage ||
                                product.image ||
                                "/placeholder.jpg";

                            // Hover görseli: aktif renge göre (sadece 2+ resim varsa)
                            const hasMultipleImages = displayColorObj?.images && Array.isArray(displayColorObj.images) && displayColorObj.images.length > 1;
                            const hoverImage = hasMultipleImages
                                ? (Array.isArray(displayColorObj.images) && displayColorObj.images.length > 1 ? displayColorObj.images[1] : null)
                                : product.secondaryImage ||
                                (defaultColor?.images && Array.isArray(defaultColor.images) && defaultColor.images.length > 1 ? defaultColor.images[1] : null) ||
                                product.primaryImage ||
                                currentImage;

                            // URL oluştur - slug varsa slug kullan, yoksa id
                            const productUrl = product.slug
                                ? `/products/${product.slug}`
                                : `/product/${product.id}`;

                            // Seçili renge göre variant ekle
                            const variant = selectedColor?.productId === product.id
                                ? selectedColor.variantCode
                                : product.colors?.[0]?.variant?.variantCode;
                            const finalUrl = variant ? `${productUrl}?variant=${variant}` : productUrl;

                            return (
                                <div key={product.id} className="group relative overflow-hidden">
                                    <Link href={finalUrl} prefetch={true} className="block">
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
                                        />
                                    </Link>

                                    <div className="mb-2">
                                        <h3 className="text-sm md:text-base font-light text-[#111] mb-1">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {product.originalPrice && product.originalPrice > product.price ? (
                                                <>
                                                    <span className="text-sm md:text-base font-light text-[#111]">
                                                        {product.price.toFixed(2)} ₺
                                                    </span>
                                                    <span className="text-xs md:text-sm text-[#111]/60 line-through">
                                                        {product.originalPrice.toFixed(2)} ₺
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-sm md:text-base font-light text-[#111]">
                                                    {product.price.toFixed(2)} ₺
                                                </span>
                                            )}
                                        </div>
                                        {product.colors.length > 0 && (
                                            <p className="text-xs text-[#111]/60 font-light mt-1">
                                                {product.colors.length} renk seçeneği
                                            </p>
                                        )}
                                        {/* Hover'da Hızlı Ekle Bölümü (Görsel 5 Tasarımı) */}
                                        <div className="mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
                                            <p className="text-[10px] tracking-[0.2em] font-light text-[#111]/40 uppercase mb-3 text-center">Hızlı ekle</p>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {(() => {
                                                    const availableSizes = product.sizes && product.sizes.length > 0
                                                        ? product.sizes
                                                        : product.sizeOptions && product.sizeOptions.length > 0
                                                            ? product.sizeOptions.map(so => ({ name: so.name, stock: 0, id: undefined }))
                                                            : [];

                                                    if (availableSizes.length === 0) {
                                                        return <p className="text-[10px] text-gray-400">Beden seçeneği yok</p>;
                                                    }

                                                    const currentColorId = displayColorObj?.id || product.colors?.[0]?.id;

                                                    return availableSizes.map((size, sizeIdx) => {
                                                        const sizeName = typeof size === 'string' ? size : size.name;
                                                        const sizeStock = typeof size === 'object' ? size.stock : 0;
                                                        const sizeId = typeof size === 'object' && (size as any).id
                                                            ? (size as any).id
                                                            : null;

                                                        let variantStock = 0;
                                                        if (currentColorId && displayColorObj?.variants) {
                                                            const variant = displayColorObj.variants.find((v: any) =>
                                                                v.colorId === currentColorId && v.sizeId === sizeId
                                                            );
                                                            variantStock = variant?.stock || 0;
                                                        }

                                                        const finalStock = variantStock > 0 ? variantStock : sizeStock;
                                                        const isOutOfStock = finalStock <= 0;

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
                                                                                    image: result.product.image || product.image,
                                                                                    price: result.product.price || product.price || 0,
                                                                                });
                                                                            }
                                                                            const cartModule = await import("@/lib/stores/cartStore");
                                                                            await cartModule.useCartStore.getState().refreshCart();
                                                                            toast.success(`${product.name} (${sizeName}) sepete eklendi`);

                                                                            // Pop-up event
                                                                            window.dispatchEvent(
                                                                                new CustomEvent("itemAddedToCart", {
                                                                                    detail: {
                                                                                        product: {
                                                                                            id: product.id,
                                                                                            name: product.name,
                                                                                            image: currentImage,
                                                                                            price: product.price || 0,
                                                                                        },
                                                                                        size: sizeName || "",
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
                                                                className={`w-10 h-10 flex items-center justify-center text-[11px] font-light border transition-all duration-300 ${isOutOfStock
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
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
