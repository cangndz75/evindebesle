"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { useCartStore, type CartItem } from "@/lib/stores/cartStore";

type ProductColor = {
    id: string;
    name: string;
    hexCode?: string | null;
    images: string[];
    variants?: Array<{
        id?: string;
        variantCode?: string | null;
        colorId?: string;
    }>;
};

type RecommendedProduct = {
    id: string;
    name: string;
    slug: string | null;
    price: number;
    originalPrice?: number | null;
    image: string | null;
    primaryImage: string | null;
    description?: string | null;
    detailText?: string | null;
    colors?: ProductColor[];
};

type ProductSize = {
    id: string;
    name: string;
    stock: number;
};

type QuickProductDetails = {
    id: string;
    name: string;
    slug: string | null;
    description?: string | null;
    detailText?: string | null;
    price: number;
    originalPrice?: number | null;
    image: string | null;
    primaryImage: string | null;
    secondaryImage?: string | null;
    colors: Array<{
        id: string;
        name: string;
        hexCode?: string | null;
        images: string[];
        variants: Array<{
            id: string;
            variantCode?: string | null;
            colorId: string;
            sizeId: string;
            stock: number;
            price?: number | null;
        }>;
    }>;
    sizes: ProductSize[];
};

function formatPriceTRY(value: number) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
    }).format(value);
}

function SectionTitle({
    title,
    subtitle,
}: {
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="space-y-1">
            <p className="text-lg font-medium tracking-wide text-black">{title}</p>
            {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
        </div>
    );
}

function ProductTile({
    product,
    onNavigate,
    onQuickAdd,
}: {
    product: RecommendedProduct;
    onNavigate?: () => void;
    onQuickAdd: (product: RecommendedProduct) => void;
}) {
    const productImage =
        product.colors?.[0]?.images?.[0] ||
        product.primaryImage ||
        product.image ||
        "/placeholder.jpg";

    const productUrl = product.slug ? `/products/${product.slug}` : `/product/${product.id}`;
    const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;

    return (
        <article className="group w-42 shrink-0" aria-label={product.name}>
            <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-[#f3f1ed]">
                <Link href={productUrl} onClick={onNavigate} className="absolute inset-0 z-10" aria-label={product.name} />
                <Image
                    src={productImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="168px"
                    unoptimized
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/2 bg-linear-to-t from-black/55 via-black/15 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onQuickAdd(product);
                        }}
                        className="h-9 min-w-30 rounded-full bg-white/95 px-4 text-[11px] font-semibold tracking-[0.12em] text-black"
                    >
                        SEPETE EKLE
                    </button>
                    <Link
                        href={productUrl}
                        onClick={(e) => {
                            e.stopPropagation();
                            onNavigate?.();
                        }}
                        className="flex h-9 min-w-30 items-center justify-center rounded-full border border-white/85 bg-black/20 px-4 text-[11px] font-semibold tracking-[0.12em] text-white"
                    >
                        DETAYI GOR
                    </Link>
                </div>
            </div>

            <div className="mt-2.5 space-y-1">
                <Link href={productUrl} onClick={onNavigate} className="block line-clamp-2 text-[18px] leading-5 font-light text-[#242424]">
                    {product.name}
                </Link>
                <div className="flex items-center gap-1.5 text-[22px] font-semibold text-[#242424]">
                    <span>{formatPriceTRY(product.price)}</span>
                    {hasDiscount ? (
                        <span className="text-[12px] font-medium text-[#919191] line-through">
                            {formatPriceTRY(product.originalPrice!)}
                        </span>
                    ) : null}
                </div>
                {product.colors && product.colors.length > 0 ? (
                    <div className="flex items-center gap-1 pt-1">
                        {product.colors.slice(0, 4).map((color) => (
                            <span
                                key={color.id}
                                className="h-3.5 w-3.5 rounded-full border border-[#d2d2d2]"
                                style={{ backgroundColor: color.hexCode || "#d8d8d8" }}
                                title={color.name}
                            />
                        ))}
                        {product.colors.length > 4 ? <span className="text-[11px] text-[#8e8e8e]">+{product.colors.length - 4}</span> : null}
                    </div>
                ) : null}
            </div>
        </article>
    );
}

export default function CartPage() {
    const { data: session } = useSession();

    const cartItems = useCartStore((state) => state.items);
    const hydrated = useCartStore((state) => state.hydrated);
    const isReady = useCartStore((state) => state.isReady);
    const hydrate = useCartStore((state) => state.hydrate);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeItem = useCartStore((state) => state.removeItem);
    const addItemOptimistic = useCartStore((state) => state.addItemOptimistic);

    const [freeShippingThreshold, setFreeShippingThreshold] = useState(99);
    const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
    const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<RecommendedProduct[]>([]);
    const [activeTab, setActiveTab] = useState<"recommended" | "recent">("recommended");
    const [sliderProgress, setSliderProgress] = useState(0);

    const [quickModalOpen, setQuickModalOpen] = useState(false);
    const [quickLoading, setQuickLoading] = useState(false);
    const [quickSubmitting, setQuickSubmitting] = useState(false);
    const [quickProduct, setQuickProduct] = useState<RecommendedProduct | null>(null);
    const [quickProductDetails, setQuickProductDetails] = useState<QuickProductDetails | null>(null);
    const [quickSelectedColorId, setQuickSelectedColorId] = useState<string | null>(null);
    const [quickSelectedSizeId, setQuickSelectedSizeId] = useState<string | null>(null);
    const [quickQuantity, setQuickQuantity] = useState(1);
    const [quickImageIndex, setQuickImageIndex] = useState(0);

    const router = useRouter();

    const emptySliderRef = useRef<HTMLDivElement | null>(null);
    const filledRecommendedRef = useRef<HTMLDivElement | null>(null);

    const scrollSlider = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
        const el = ref.current;
        if (!el) return;
        const amount = 320;
        el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    };

    const parseImages = (images: unknown) => {
        if (Array.isArray(images)) return images.filter((img): img is string => typeof img === "string" && !!img);
        if (typeof images === "string") {
            try {
                const parsed = JSON.parse(images);
                if (Array.isArray(parsed)) return parsed.filter((img): img is string => typeof img === "string" && !!img);
                return images ? [images] : [];
            } catch {
                return images ? [images] : [];
            }
        }
        return [];
    };

    const buildQuickImages = (product: QuickProductDetails) => {
        const selectedColor = product.colors.find((c) => c.id === quickSelectedColorId);
        const list: string[] = [];
        if (selectedColor?.images?.length) {
            selectedColor.images.forEach((img) => {
                if (img && !list.includes(img)) list.push(img);
            });
        }
        [product.primaryImage, product.secondaryImage, product.image].forEach((img) => {
            if (img && !list.includes(img)) list.push(img);
        });
        if (list.length === 0) list.push("/placeholder.jpg");
        return list;
    };

    const getSwatchStyle = (color: { name: string; hexCode?: string | null; images?: string[] }) => {
        if (color.hexCode) {
            return { backgroundColor: color.hexCode };
        }

        const normalized = (color.name || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/ı/g, "i")
            .replace(/ğ/g, "g")
            .replace(/ü/g, "u")
            .replace(/ş/g, "s")
            .replace(/ö/g, "o")
            .replace(/ç/g, "c")
            .replace(/[^a-z0-9 ]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const toneMap: Array<{ keys: string[]; hex: string }> = [
            { keys: ["siyah", "black"], hex: "#000000" },
            { keys: ["ekru", "ecru", "krem", "ivory"], hex: "#e8e1cf" },
            { keys: ["beyaz", "white"], hex: "#f6f6f6" },
            { keys: ["gri", "gray", "grey"], hex: "#a8a8a8" },
            { keys: ["antrasit", "anthracite", "koyu gri"], hex: "#4a4f56" },
            { keys: ["lacivert", "navy"], hex: "#1f2d4f" },
            { keys: ["mavi", "blue"], hex: "#3f5f9f" },
            { keys: ["bej", "beige", "tas"], hex: "#cdbca6" },
            { keys: ["vizon", "kum", "nude"], hex: "#c8b5a1" },
            { keys: ["kahve", "camel", "taba", "brown"], hex: "#8a6642" },
            { keys: ["pembe", "pink", "gul"], hex: "#dba9af" },
            { keys: ["kirmizi", "red", "bordo", "burgundy"], hex: "#8d2f3c" },
            { keys: ["yesil", "green", "haki", "khaki"], hex: "#6d7b52" },
            { keys: ["sari", "yellow", "hardal", "gold"], hex: "#b7923a" },
            { keys: ["mor", "purple", "lila", "lavanta"], hex: "#816d9b" },
            { keys: ["turuncu", "orange", "kiremit", "terracotta"], hex: "#b76846" },
        ];

        const match = toneMap.find((item) => item.keys.some((key) => normalized.includes(key)));
        if (match) {
            return { backgroundColor: match.hex };
        }

        if (color.images?.[0]) {
            return {
                backgroundImage: `url(${color.images[0]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            };
        }

        return { backgroundColor: "#d3d3d3" };
    };

    const getSizeStockForColor = (product: QuickProductDetails, colorId: string | null, sizeId: string) => {
        if (!colorId) {
            const found = product.sizes.find((s) => s.id === sizeId);
            return found?.stock ?? 0;
        }
        const selectedColor = product.colors.find((c) => c.id === colorId);
        if (!selectedColor) {
            const found = product.sizes.find((s) => s.id === sizeId);
            return found?.stock ?? 0;
        }
        const colorVariant = selectedColor.variants.find((v) => v.sizeId === sizeId);
        if (colorVariant) return colorVariant.stock;
        const found = product.sizes.find((s) => s.id === sizeId);
        return found?.stock ?? 0;
    };

    const openQuickModal = async (product: RecommendedProduct) => {
        setQuickProduct(product);
        setQuickModalOpen(true);
        setQuickLoading(true);
        setQuickSubmitting(false);
        setQuickQuantity(1);
        setQuickImageIndex(0);
        setQuickSelectedColorId(null);
        setQuickSelectedSizeId(null);
        try {
            const res = await fetch(`/api/products/${product.id}`);
            if (!res.ok) {
                toast.error("Ürün bilgisi yüklenemedi");
                setQuickProductDetails(null);
                return;
            }
            const data = await res.json();
            const details: QuickProductDetails = {
                id: data.id,
                name: data.name,
                slug: data.slug || null,
                description: data.description || null,
                detailText: data.detailText || null,
                price: data.price,
                originalPrice: data.originalPrice || null,
                image: data.image || null,
                primaryImage: data.primaryImage || null,
                secondaryImage: data.secondaryImage || null,
                colors: (data.colors || []).map((color: any) => ({
                    id: color.id,
                    name: color.name,
                    hexCode: color.hexCode || null,
                    images: parseImages(color.images),
                    variants: Array.isArray(color.variants) ? color.variants : [],
                })),
                sizes: (data.sizes || []).map((size: any) => ({
                    id: size.id,
                    name: size.name,
                    stock: typeof size.stock === "number" ? size.stock : 0,
                })),
            };
            setQuickProductDetails(details);

            const initialColorId = details.colors[0]?.id || null;
            setQuickSelectedColorId(initialColorId);

            const firstAvailableSize = details.sizes.find((size) => getSizeStockForColor(details, initialColorId, size.id) > 0);
            setQuickSelectedSizeId(firstAvailableSize?.id || null);
        } catch {
            toast.error("Ürün bilgisi yüklenemedi");
            setQuickProductDetails(null);
        } finally {
            setQuickLoading(false);
        }
    };

    const handleQuickAddToCart = async () => {
        if (!quickProduct || !quickProductDetails) return;
        if (quickSubmitting) return;

        const selectedColor = quickProductDetails.colors.find((c) => c.id === quickSelectedColorId) || null;
        const hasSizes = quickProductDetails.sizes.length > 0;
        const selectedSize = quickProductDetails.sizes.find((s) => s.id === quickSelectedSizeId) || null;

        if (hasSizes && !selectedSize) {
            toast.error("Lutfen beden seciniz");
            return;
        }

        setQuickSubmitting(true);
        try {
            const productImage = selectedColor?.images?.[0] || quickProductDetails.primaryImage || quickProductDetails.image;
            await addItemOptimistic({
                productId: quickProduct.id,
                colorId: selectedColor?.id || null,
                sizeId: selectedSize?.id || null,
                quantity: quickQuantity,
                product: {
                    id: quickProduct.id,
                    name: quickProductDetails.name || quickProduct.name,
                    image: productImage || "/placeholder.jpg",
                    price: quickProductDetails.price ?? quickProduct.price,
                    originalPrice: quickProductDetails.originalPrice || null,
                },
                color: selectedColor ? { id: selectedColor.id, name: selectedColor.name } : null,
                size: selectedSize ? { id: selectedSize.id, name: selectedSize.name } : null,
            });
            toast.success("Ürün sepete eklendi");
            setQuickModalOpen(false);
        } catch {
            toast.error("Sepete eklenirken bir hata oluştu");
        } finally {
            setQuickSubmitting(false);
        }
    };

    const updateSliderProgress = () => {
        const ref = activeTab === "recommended" ? filledRecommendedRef : emptySliderRef;
        const el = ref.current;
        if (!el) {
            setSliderProgress(0);
            return;
        }
        const max = el.scrollWidth - el.clientWidth;
        if (max <= 0) {
            setSliderProgress(100);
            return;
        }
        setSliderProgress((el.scrollLeft / max) * 100);
    };

    const handleCreateOrder = () => {
        if (cartItems.length === 0) {
            toast.error("Sepetiniz boş");
            return;
        }
        router.push("/checkout");
    };

    const loadCompanySettings = async () => {
        try {
            const res = await fetch("/api/company-settings");
            if (res.ok) {
                const data = await res.json();
                setFreeShippingThreshold(Number(data.freeShippingThreshold) || 99);
            }
        } catch (error) {
            console.error("Error loading company settings:", error);
        }
    };

    const loadRecommendedProducts = async (items: CartItem[]) => {
        try {
            if (items.length > 0) {
                const productIds = items.map((i) => i.productId);
                const res = await fetch(`/api/products/recommended?productIds=${productIds.join(",")}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setRecommendedProducts(data);
                        return;
                    }
                }
            }
            const res2 = await fetch("/api/products?take=12");
            if (res2.ok) {
                const data2 = await res2.json();
                setRecommendedProducts(Array.isArray(data2) ? data2 : []);
            }
        } catch (error) {
            console.error("Error loading recommended products:", error);
        }
    };

    const loadRecentlyViewed = async () => {
        try {
            const localProducts = getRecentlyViewed();
            const localIds = localProducts.map((p) => p.productId || p.id).filter(Boolean);

            if (localIds.length === 0 && !session?.user) {
                setRecentlyViewedProducts([]);
                return;
            }

            try {
                const idsQuery = localIds.length > 0 ? `?ids=${localIds.join(",")}` : "";
                const res = await fetch(`/api/products/recent-views${idsQuery}`);

                if (res.ok) {
                    const data = await res.json();
                    const apiProducts = Array.isArray(data?.products) ? data.products : [];

                    const apiFormatted = apiProducts.map((p: any) => ({
                        id: p.id,
                        productId: p.id,
                        name: p.name,
                        slug: p.slug || null,
                        price: p.price,
                        image: p.primaryImage || p.image || null,
                        primaryImage: p.primaryImage || p.image || null,
                        colors: p.colors || [],
                    }));

                    setRecentlyViewedProducts(apiFormatted);
                } else {
                    console.error("Failed to fetch recent views");
                    setRecentlyViewedProducts([]);
                }
            } catch (apiError) {
                console.error("Error fetching API recent views:", apiError);
                setRecentlyViewedProducts([]);
            }
        } catch (error) {
            console.error("Error loading recently viewed products:", error);
            setRecentlyViewedProducts([]);
        }
    };

    const prevProductIdsRef = useRef<string>("");
    const hasLoadedRecommendedRef = useRef(false);

    useEffect(() => {
        if (!hydrated) {
            hydrate();
        }
        loadCompanySettings();
    }, [hydrated, hydrate]);

    useEffect(() => {
        if (activeTab === "recent") {
            loadRecentlyViewed();
        } else if (activeTab === "recommended" && !hasLoadedRecommendedRef.current) {
            const currentProductIds = cartItems.map(item => item.productId).sort().join(",");
            if (currentProductIds !== prevProductIdsRef.current) {
                prevProductIdsRef.current = currentProductIds;
                loadRecommendedProducts(cartItems);
                hasLoadedRecommendedRef.current = true;
            }
        }
    }, [activeTab, cartItems]);

    useEffect(() => {
        const timeout = setTimeout(() => updateSliderProgress(), 80);
        return () => clearTimeout(timeout);
    }, [activeTab, recommendedProducts.length, recentlyViewedProducts.length]);

    const totalPrice = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    }, [cartItems]);

    const remainingForFreeShipping = useMemo(() => {
        return Math.max(0, freeShippingThreshold - totalPrice);
    }, [freeShippingThreshold, totalPrice]);

    const freeShippingProgress = useMemo(() => {
        if (freeShippingThreshold <= 0) return 0;
        return Math.min(100, (totalPrice / freeShippingThreshold) * 100);
    }, [freeShippingThreshold, totalPrice]);

    const qualifiesForFreeShipping = totalPrice >= freeShippingThreshold;

    const getProductImage = (item: CartItem) => {
        if (item.color?.images) {
            let colorImages: string[] = [];
            if (typeof item.color.images === 'string') {
                try {
                    colorImages = JSON.parse(item.color.images);
                } catch {
                    colorImages = [item.color.images];
                }
            } else if (Array.isArray(item.color.images)) {
                colorImages = item.color.images;
            }
            if (colorImages.length > 0) {
                return colorImages[0];
            }
        }

        if (item.product.colors?.[0]?.images) {
            let productColorImages: string[] = [];
            if (typeof item.product.colors[0].images === 'string') {
                try {
                    productColorImages = JSON.parse(item.product.colors[0].images);
                } catch {
                    productColorImages = [item.product.colors[0].images];
                }
            } else if (Array.isArray(item.product.colors[0].images)) {
                productColorImages = item.product.colors[0].images;
            }
            if (productColorImages.length > 0) {
                return productColorImages[0];
            }
        }

        return item.product.primaryImage || item.product.image || "/placeholder.jpg";
    };

    const getProductUrl = (item: CartItem) => {
        if (item.product.slug) return `/products/${item.product.slug}`;
        return `/product/${item.product.id}`;
    };

    const activeList = activeTab === "recommended" ? recommendedProducts : recentlyViewedProducts;
    const itemCount = cartItems.reduce((acc, it) => acc + (it.quantity || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-serif text-black">Sepetim</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {cartItems.length > 0 ? `${itemCount} ürün` : "Henüz ürün yok"}
                            </p>
                        </div>
                    </div>

                    <div className="p-8">
                        {!isReady && cartItems.length === 0 ? (
                            <div className="space-y-4 py-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="h-24 w-24 shrink-0 rounded-xl bg-gray-100 animate-pulse" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                                            <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
                                            <div className="h-3 w-1/3 rounded bg-gray-100 animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                
                                {cartItems.length > 0 && (
                                    <div className="mb-8 rounded-2xl border border-black/5 bg-gray-50 p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-0.5 rounded-xl bg-white p-2.5 shadow-sm">
                                                <ShoppingBag className="h-5 w-5 text-black" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="text-sm text-gray-800">
                                                    {qualifiesForFreeShipping ? (
                                                        <span className="font-medium text-black">
                                                            Ücretsiz kargo için yeterli tutara ulaştınız.
                                                        </span>
                                                    ) : (
                                                        <>
                                                            Ücretsiz kargo için{" "}
                                                            <span className="font-medium text-black">
                                                                {formatPriceTRY(remainingForFreeShipping)}
                                                            </span>{" "}
                                                            daha ekleyin.
                                                        </>
                                                    )}
                                                </p>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                                    <div
                                                        className={`h-full ${qualifiesForFreeShipping ? 'bg-emerald-500' : 'bg-black'} transition-all duration-300`}
                                                        style={{ width: `${freeShippingProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ShoppingBag className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h2 className="text-xl font-medium text-black mb-2">
                                            Sepetiniz Boş
                                        </h2>
                                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                            Ürünlere göz atın ve favorilerinizi sepete ekleyin.
                                        </p>
                                        <Button
                                            onClick={() => router.push("/")}
                                            className="rounded-full px-8 py-6 text-base bg-black hover:bg-black/80"
                                        >
                                            Alışverişe Başla
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {cartItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex gap-6 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
                                            >
                                                <Link
                                                    href={getProductUrl(item)}
                                                    className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100"
                                                >
                                                    <Image
                                                        src={getProductImage(item)}
                                                        alt={item.product.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="120px"
                                                        unoptimized
                                                    />
                                                </Link>

                                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start gap-4">
                                                            <Link
                                                                href={getProductUrl(item)}
                                                                className="text-base font-medium text-black hover:underline line-clamp-2"
                                                            >
                                                                {item.product.name}
                                                            </Link>
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            {item.color?.name || "Renk"} • {item.size?.name || "Beden"}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-4">
                                                        <div className="inline-flex items-center rounded-full border border-gray-200 bg-white shadow-sm">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                disabled={item.quantity <= 1}
                                                                className="h-8 w-8 grid place-items-center rounded-full hover:bg-gray-50 disabled:opacity-40"
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </button>
                                                            <span className="w-8 text-center text-sm font-medium">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                className="h-8 w-8 grid place-items-center rounded-full hover:bg-gray-50"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-semibold text-black">
                                                                {formatPriceTRY(item.product.price * item.quantity)}
                                                            </p>
                                                            {item.quantity > 1 && (
                                                                <p className="text-xs text-gray-500">
                                                                    {formatPriceTRY(item.product.price)} adet
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                
                                {cartItems.length > 0 && (
                                    <div className="mt-8 border-t border-gray-100 pt-8">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-gray-600">Ara Toplam</span>
                                            <span className="text-xl font-serif text-black">{formatPriceTRY(totalPrice)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 text-right mb-6">
                                            Vergiler ve kargo ödeme adımında hesaplanır.
                                        </p>
                                        <div className="flex flex-col gap-3">
                                            <Button
                                                onClick={handleCreateOrder}
                                                className="w-full h-14 rounded-2xl bg-black text-white hover:bg-black/90 text-lg"
                                            >
                                                Sepeti Onayla ve Satın Al
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push("/")}
                                                className="w-full h-12 rounded-2xl border-gray-200"
                                            >
                                                Alışverişe Devam Et
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                
                {(cartItems.length === 0 || activeList.length > 0) && (
                    <div className="mt-12 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-8 border-b border-gray-100 w-full">
                                <button
                                    onClick={() => setActiveTab("recommended")}
                                    className={[
                                        "pb-3 text-sm font-medium transition-colors relative",
                                        activeTab === "recommended"
                                            ? "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black"
                                            : "text-gray-500 hover:text-black",
                                    ].join(" ")}
                                >
                                    Özellikle Sizin İçin
                                </button>
                                <button
                                    onClick={() => setActiveTab("recent")}
                                    className={[
                                        "pb-3 text-sm font-medium transition-colors relative",
                                        activeTab === "recent"
                                            ? "text-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black"
                                            : "text-gray-500 hover:text-black",
                                    ].join(" ")}
                                >
                                    Son Görüntülenenler
                                </button>
                            </div>
                            <div className="hidden sm:flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => scrollSlider(activeTab === "recommended" ? filledRecommendedRef : emptySliderRef, "left")}
                                    className="h-9 w-9 rounded-full border border-gray-200 hover:bg-gray-50 grid place-items-center"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollSlider(activeTab === "recommended" ? filledRecommendedRef : emptySliderRef, "right")}
                                    className="h-9 w-9 rounded-full border border-gray-200 hover:bg-gray-50 grid place-items-center"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <div
                                ref={activeTab === "recommended" ? filledRecommendedRef : emptySliderRef}
                                onScroll={updateSliderProgress}
                                className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            >
                                {activeList.map((p) => (
                                    <ProductTile key={p.id} product={p} onNavigate={() => undefined} onQuickAdd={openQuickModal} />
                                ))}
                                {activeList.length === 0 && (
                                    <div className="text-gray-500 py-4 w-full text-center">
                                        Bu kategori için öneri bulunamadı.
                                    </div>
                                )}
                            </div>
                            {activeList.length > 0 ? (
                                <div className="mt-1 flex items-center gap-2 px-1">
                                    <button
                                        type="button"
                                        onClick={() => scrollSlider(activeTab === "recommended" ? filledRecommendedRef : emptySliderRef, "left")}
                                        className="h-5 w-5 shrink-0 rounded-full text-gray-500 hover:text-black"
                                        aria-label="Sola kaydir"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <div className="relative h-2 flex-1 rounded-full bg-gray-200">
                                        <span
                                            className="absolute left-0 top-0 h-2 rounded-full bg-gray-500 transition-all duration-200"
                                            style={{ width: `${Math.min(100, Math.max(12, sliderProgress))}%` }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => scrollSlider(activeTab === "recommended" ? filledRecommendedRef : emptySliderRef, "right")}
                                        className="h-5 w-5 shrink-0 rounded-full text-gray-500 hover:text-black"
                                        aria-label="Saga kaydir"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}

            </div>

            <Dialog open={quickModalOpen} onOpenChange={setQuickModalOpen}>
                <DialogContent className="max-w-[92vw] sm:max-w-245 p-0 overflow-hidden border border-[#e9e9e9] rounded-2xl">
                    <DialogTitle className="sr-only">Ürün Detayı</DialogTitle>
                    <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr] bg-white">
                        <div className="relative min-h-85 md:min-h-155 bg-[#f4f1ed]">
                            {(() => {
                                const images = quickProductDetails ? buildQuickImages(quickProductDetails) : [quickProduct?.primaryImage || quickProduct?.image || "/placeholder.jpg"];
                                const image = images[quickImageIndex] || images[0] || "/placeholder.jpg";
                                return (
                                    <>
                                        <Image
                                            src={image}
                                            alt={quickProductDetails?.name || quickProduct?.name || "Ürün"}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 48vw"
                                            unoptimized
                                        />
                                        <div className="absolute left-4 bottom-4 flex items-center gap-2">
                                            {images.slice(0, 4).map((thumb, idx) => (
                                                <button
                                                    key={`${thumb}-${idx}`}
                                                    type="button"
                                                    onClick={() => setQuickImageIndex(idx)}
                                                    className={`relative h-10 w-10 overflow-hidden rounded border ${quickImageIndex === idx ? "border-black" : "border-[#d7d7d7]"}`}
                                                >
                                                    <Image src={thumb} alt="thumb" fill className="object-cover" sizes="40px" unoptimized />
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <div className="p-5 md:p-7">
                            {quickLoading ? (
                                <div className="space-y-4">
                                    <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
                                    <div className="h-8 w-56 rounded bg-gray-100 animate-pulse" />
                                    <div className="h-5 w-24 rounded bg-gray-100 animate-pulse" />
                                    <div className="h-20 w-full rounded bg-gray-100 animate-pulse" />
                                </div>
                            ) : quickProductDetails ? (
                                <div>
                                    <p className="text-[12px] font-semibold tracking-[0.16em] text-[#b9ae99] uppercase">Kombin Tamamla</p>
                                    <h3 className="mt-2 text-[36px] leading-10 font-light text-[#292929]">
                                        {quickProductDetails.name}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[32px] font-semibold text-[#252525]">{formatPriceTRY(quickProductDetails.price)}</span>
                                        {quickProductDetails.originalPrice && quickProductDetails.originalPrice > quickProductDetails.price ? (
                                            <span className="text-sm text-[#8f8f8f] line-through">{formatPriceTRY(quickProductDetails.originalPrice)}</span>
                                        ) : null}
                                    </div>

                                    {(quickProductDetails.description || quickProductDetails.detailText) ? (
                                        <p className="mt-4 text-sm leading-6 text-[#666] line-clamp-4">
                                            {quickProductDetails.description || quickProductDetails.detailText}
                                        </p>
                                    ) : null}

                                    {quickProductDetails.colors.length > 0 ? (
                                        <div className="mt-6">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold tracking-[0.14em] text-[#585858] uppercase">Renk</p>
                                                <span className="text-sm text-[#8a8a8a]">
                                                    {quickProductDetails.colors.find((c) => c.id === quickSelectedColorId)?.name || "Seciniz"}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2.5">
                                                {quickProductDetails.colors.map((color) => (
                                                    <button
                                                        key={color.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setQuickSelectedColorId(color.id);
                                                            const available = quickProductDetails.sizes.find((size) => getSizeStockForColor(quickProductDetails, color.id, size.id) > 0);
                                                            setQuickSelectedSizeId(available?.id || null);
                                                            setQuickImageIndex(0);
                                                        }}
                                                        className={`h-7 w-7 rounded-full border-2 p-0.5 ${quickSelectedColorId === color.id ? "border-[#4d5562]" : "border-[#e6e6e6]"}`}
                                                        aria-label={color.name}
                                                    >
                                                        <span className="block h-full w-full rounded-full" style={getSwatchStyle(color)} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    {quickProductDetails.sizes.length > 0 ? (
                                        <div className="mt-5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold tracking-[0.14em] text-[#585858] uppercase">Beden</p>
                                                <Link
                                                    href={quickProductDetails.slug ? `/products/${quickProductDetails.slug}` : `/product/${quickProductDetails.id}`}
                                                    className="text-xs text-[#888] underline underline-offset-2"
                                                >
                                                    Beden Rehberi
                                                </Link>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {quickProductDetails.sizes.map((size) => {
                                                    const stock = getSizeStockForColor(quickProductDetails, quickSelectedColorId, size.id);
                                                    const soldOut = stock <= 0;
                                                    const active = quickSelectedSizeId === size.id;
                                                    return (
                                                        <button
                                                            key={size.id}
                                                            type="button"
                                                            disabled={soldOut}
                                                            onClick={() => setQuickSelectedSizeId(size.id)}
                                                            className={`h-9 min-w-11 rounded border px-3 text-sm ${active ? "border-black bg-black text-white" : soldOut ? "border-[#ececec] text-[#c5c5c5] line-through" : "border-[#dbdbdb] text-[#555] hover:border-black"}`}
                                                        >
                                                            {size.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="mt-5 flex items-center gap-3">
                                        <div className="inline-flex items-center rounded border border-[#dfdfdf] bg-white">
                                            <button
                                                type="button"
                                                onClick={() => setQuickQuantity((prev) => Math.max(1, prev - 1))}
                                                className="h-9 w-9 grid place-items-center text-[#888] hover:text-black"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="w-8 text-center text-sm">{quickQuantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => setQuickQuantity((prev) => prev + 1)}
                                                className="h-9 w-9 grid place-items-center text-[#888] hover:text-black"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-2.5">
                                        <Button
                                            onClick={handleQuickAddToCart}
                                            disabled={quickSubmitting}
                                            className="h-12 w-full rounded-none bg-black text-white hover:bg-black/90 tracking-[0.15em] text-xs"
                                        >
                                            {quickSubmitting ? "EKLENIYOR" : "SEPETE EKLE"}
                                        </Button>
                                        <Link
                                            href={quickProductDetails.slug ? `/products/${quickProductDetails.slug}` : `/product/${quickProductDetails.id}`}
                                            className="flex h-11 w-full items-center justify-center border border-[#dddddd] text-xs tracking-[0.15em] text-[#808080]"
                                        >
                                            URUNU INCELE
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-10 text-sm text-[#777]">Ürün bilgisi bulunamadı.</div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
