"use client";
 
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Heart, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import HoverImageSlider from "@/components/product/HoverImageSlider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resolveSwatchHex } from "@/lib/color-swatch";

type ProductColor = {
    id?: string;
    name: string;
    hexCode?: string;
    images: string[];
    variants?: any[];
};

type ProductSize = {
    id?: string;
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
    primaryImage?: string;
    secondaryImage?: string;
    colors: ProductColor[];
    sizes: ProductSize[];
    sizeOptions?: Array<{ name: string; isActive: boolean }>;
};

function getProductTotalStock(product: Product): number {
    const variants = product.colors?.flatMap((color) => color.variants ?? []) ?? [];
    const variantStockTotal = variants.reduce((sum, variant) => sum + (Number(variant?.stock) || 0), 0);
    const sizeStockTotal = product.sizes?.reduce((sum, size) => sum + (Number(size.stock) || 0), 0) || 0;

    return Math.max(variantStockTotal, sizeStockTotal);
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
        setIsLoading(true);
        try {
            if (isFavorite) {
                await fetch(`/api/favorites?productId=${productId}`, { method: "DELETE" });
                setIsFavorite(false);
                toast.success(`${productName} favorilerden çıkarıldı`);
            } else {
                await fetch("/api/favorites", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId }),
                });
                setIsFavorite(true);
                toast.success(`${productName} favorilere eklendi`);
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
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-[#111] text-[#111]" : "text-[#111]"}`} />
        </button>
    );
}

export default function NewArrivalsPage() {
    const [sortOption, setSortOption] = useState("date-new");
    const [sortDialogOpen, setSortDialogOpen] = useState(false);
    const [hoveredColor, setHoveredColor] = useState<{ productId: string; colorImage: string } | null>(null);

    const fetcher = useCallback(async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
    }, []);

    const { data: products, isLoading } = useSWR<Product[]>(
        `/api/products?newArrivals=true&sort=${sortOption}`,
        fetcher
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 pt-20 md:pt-24">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-light text-[#111] mb-4 uppercase tracking-tight">YENİ GELENLER</h1>
                        <p className="text-sm text-[#111]/60 font-light max-w-xl">
                            Sezonun en trend, en çok dikkat çeken yeni parçalarını hemen keşfedin. Tasarım ve konforun buluştuğu en yeni koleksiyonumuz.
                        </p>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                        <span className="text-sm text-[#111]/60 font-light">
                            {products?.length || 0} ürün
                        </span>
                        
                        <button
                            onClick={() => setSortDialogOpen(true)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 text-xs font-light text-[#111] border border-[#111]"
                        >
                            <ArrowUpDown className="w-3 h-3" />
                            <span>SIRALA</span>
                        </button>

                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-sm text-[#111] font-light">Sırala:</span>
                            <Select value={sortOption} onValueChange={setSortOption}>
                                <SelectTrigger className="w-50 border-none bg-transparent text-sm font-light text-[#111] focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date-new">En Yeniler</SelectItem>
                                    <SelectItem value="price-low">Fiyat: Düşükten Yükseğe</SelectItem>
                                    <SelectItem value="price-high">Fiyat: Yüksekten Düşüğe</SelectItem>
                                    <SelectItem value="date-old">En Eskiler</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="animate-pulse bg-gray-50 aspect-3/4 rounded-sm" />
                        ))}
                    </div>
                ) : !products || products.length === 0 ? (
                    <div className="text-center py-20 text-[#111]/40 font-light">
                        Henüz yeni gelen ürün bulunmamaktadır.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
                        {products.map((product) => {
                            const totalStock = getProductTotalStock(product);
                            const isOutOfStock = totalStock === 0;

                            const activeColorImage = hoveredColor?.productId === product.id 
                                ? hoveredColor.colorImage 
                                : product.colors?.[0]?.images?.[0] || product.primaryImage || product.image || "/placeholder.jpg";

                            const displayColorObj = product.colors?.find(c => c.images?.[0] === activeColorImage) || product.colors?.[0];

                            return (
                                <div key={product.id} className={`group ${isOutOfStock ? "opacity-75" : ""}`}>
                                    <Link href={`/products/${product.slug || product.id}`} className="block relative">
                                        <HoverImageSlider
                                            images={
                                                displayColorObj?.images && displayColorObj.images.length > 0
                                                    ? displayColorObj.images
                                                    : [product.primaryImage || product.image || "/placeholder.jpg", product.secondaryImage].filter(Boolean) as string[]
                                            }
                                            alt={product.name}
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            className="mb-4"
                                            aspectRatio="portrait"
                                            isOutOfStock={isOutOfStock}
                                            favoriteButton={<FavoriteButton productId={product.id} productName={product.name} />}
                                        />
                                    </Link>

                                    <div className="space-y-1 mb-2 text-center">
                                        <h3 className="text-xs md:text-sm font-light text-[#111] uppercase tracking-wide truncate">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-sm font-light text-[#111]">
                                                {product.price.toFixed(2)} ₺
                                            </span>
                                            {product.originalPrice && product.originalPrice > product.price && (
                                                <span className="text-xs text-[#111]/40 line-through font-light">
                                                    {product.originalPrice.toFixed(2)} ₺
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    
                                    <div className="flex items-center justify-center gap-1.5 mt-2">
                                        {Array.from(new Map(product.colors.filter(c => c.images?.[0]).map(c => [c.hexCode || c.name, c])).values()).map((color, idx) => (
                                            <button
                                                key={idx}
                                                onMouseEnter={() => setHoveredColor({ productId: product.id, colorImage: color.images?.[0] || "" })}
                                                onMouseLeave={() => setHoveredColor(null)}
                                                className={`w-3 h-3 rounded-full border transition-all ${activeColorImage === color.images?.[0] ? "border-[#111] scale-110" : "border-gray-200"}`}
                                                style={{ backgroundColor: resolveSwatchHex({ name: color.name, hexCode: color.hexCode }) }}
                                            />
                                        ))}
                                    </div>

                                    
                                    <div className="hidden md:grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100">
                                        <div className="overflow-hidden">
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <p className="text-[10px] tracking-[0.2em] font-light text-[#111]/40 uppercase mb-3 text-center">Hızlı ekle</p>
                                                <div className="flex flex-wrap gap-2 justify-center">
                                                    {(() => {
                                                        const availableSizes = product.sizes && product.sizes.length > 0
                                                            ? product.sizes
                                                            : product.sizeOptions && product.sizeOptions.length > 0
                                                                ? product.sizeOptions.map((so: any) => ({ name: so.name, stock: 0, id: so.id }))
                                                                : [];

                                                        if (availableSizes.length === 0) return <p className="text-[10px] text-gray-400">Beden yok</p>;

                                                        const currentColorId = displayColorObj?.id;
                                                        const SIZE_ORDER = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "XXXXL", "4XL"];

                                                        const inStockSizes = availableSizes.map((size: any) => {
                                                            const sizeName = typeof size === 'string' ? size : size.name;
                                                            const sizeStock = typeof size === 'object' ? size.stock || 0 : 0;
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
                                                        }).filter(item => item.finalStock > 0).sort((a, b) => {
                                                            const orderA = SIZE_ORDER.indexOf(a.sizeName.toUpperCase());
                                                            const orderB = SIZE_ORDER.indexOf(b.sizeName.toUpperCase());
                                                            if (orderA !== -1 && orderB !== -1) return orderA - orderB;
                                                            if (orderA !== -1) return -1;
                                                            if (orderB !== -1) return 1;
                                                            return a.sizeName.localeCompare(b.sizeName);
                                                        });

                                                        if (inStockSizes.length === 0) return <p className="text-[10px] text-gray-400">Tükendi</p>;

                                                        return inStockSizes.map(({ size, sizeName, sizeId, finalStock }, sIdx) => {
                                                            const isOutOfStock = false;

                                                            return (
                                                                <button
                                                                    key={sIdx}
                                                                    disabled={isOutOfStock}
                                                                    onClick={async (e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        if (isOutOfStock) return;
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
                                                                                        name: result.product.name,
                                                                                        image: result.product.image,
                                                                                        price: result.product.price,
                                                                                    });
                                                                                }
                                                                                const cartStore = await import("@/lib/stores/cartStore");
                                                                                cartStore.useCartStore.getState().refreshCart();
                                                                                
                                                                                window.dispatchEvent(
                                                                                    new CustomEvent("itemAddedToCart", {
                                                                                        detail: {
                                                                                            product: {
                                                                                                id: product.id,
                                                                                                name: product.name,
                                                                                                image: activeColorImage,
                                                                                                price: product.price || 0,
                                                                                            },
                                                                                            size: sizeName || "",
                                                                                            color: displayColorObj?.name || "",
                                                                                        },
                                                                                    })
                                                                                );
                                                                            }
                                                                        } catch { toast.error("Hata oluştu"); }
                                                                    }}
                                                                    className={`w-9 h-9 flex items-center justify-center text-[10px] font-light border transition-all ${isOutOfStock 
                                                                        ? "text-gray-300 border-gray-100 cursor-not-allowed" 
                                                                        : "border-gray-200 text-[#111] hover:bg-black hover:text-white hover:border-black"}`}
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
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            
            <Dialog open={sortDialogOpen} onOpenChange={setSortDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>SIRALA</DialogTitle></DialogHeader>
                    <RadioGroup value={sortOption} onValueChange={(val) => { setSortOption(val); setSortDialogOpen(false); }} className="mt-4">
                        {[
                            { id: "date-new", label: "En Yeniler" },
                            { id: "price-low", label: "Fiyat: Düşükten Yükseğe" },
                            { id: "price-high", label: "Fiyat: Yüksekten Düşüğe" },
                            { id: "date-old", label: "En Eskiler" }
                        ].map(opt => (
                            <div key={opt.id} className="flex items-center space-x-2 py-4 border-b last:border-0 border-gray-50">
                                <RadioGroupItem value={opt.id} id={opt.id} />
                                <Label htmlFor={opt.id} className="flex-1 cursor-pointer font-light">{opt.label}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </DialogContent>
            </Dialog>
        </div>
    );
}
