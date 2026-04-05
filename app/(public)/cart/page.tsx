"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { useCartStore, type CartItem } from "@/lib/stores/cartStore";

type RecommendedProduct = {
    id: string;
    name: string;
    slug: string | null;
    price: number;
    image: string | null;
    primaryImage: string | null;
    colors?: Array<{
        images: string[];
    }>;
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
    onClick,
}: {
    product: RecommendedProduct;
    onClick?: () => void;
}) {
    const productImage =
        product.colors?.[0]?.images?.[0] ||
        product.primaryImage ||
        product.image ||
        "/placeholder.jpg";

    const productUrl = product.slug ? `/products/${product.slug}` : `/product/${product.id}`;

    return (
        <Link
            href={productUrl}
            onClick={onClick}
            className="group block w-[180px] shrink-0"
            aria-label={product.name}
        >
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
                <Image
                    src={productImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    sizes="200px"
                    unoptimized
                />
            </div>
            <div className="mt-3 space-y-1">
                <p className="line-clamp-2 text-sm font-light text-gray-900">{product.name}</p>
                <p className="text-sm font-medium text-black">{formatPriceTRY(product.price)}</p>
            </div>
        </Link>
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

    const [freeShippingThreshold, setFreeShippingThreshold] = useState(99);
    const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
    const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<RecommendedProduct[]>([]);
    const [activeTab, setActiveTab] = useState<"recommended" | "recent">("recommended");

    const router = useRouter();

    const emptySliderRef = useRef<HTMLDivElement | null>(null);
    const filledRecommendedRef = useRef<HTMLDivElement | null>(null);

    const scrollSlider = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
        const el = ref.current;
        if (!el) return;
        const amount = 320;
        el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    };

    const handleCreateOrder = () => {
        if (cartItems.length === 0) {
            toast.error("Sepetiniz boÅŸ");
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
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-serif text-black">Sepetim</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {cartItems.length > 0 ? `${itemCount} Ã¼rÃ¼n` : "HenÃ¼z Ã¼rÃ¼n yok"}
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
                                {/* FREE SHIPPING BAR */}
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
                                                            Ãœcretsiz kargo iÃ§in yeterli tutara ulaÅŸtÄ±nÄ±z.
                                                        </span>
                                                    ) : (
                                                        <>
                                                            Ãœcretsiz kargo iÃ§in{" "}
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

                                {/* EMPTY STATE */}
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ShoppingBag className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h2 className="text-xl font-medium text-black mb-2">
                                            Sepetiniz BoÅŸ
                                        </h2>
                                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                            ÃœrÃ¼nlere gÃ¶z atÄ±n ve favorilerinizi sepete ekleyin.
                                        </p>
                                        <Button
                                            onClick={() => router.push("/")}
                                            className="rounded-full px-8 py-6 text-base bg-black hover:bg-black/80"
                                        >
                                            AlÄ±ÅŸveriÅŸe BaÅŸla
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
                                                            {item.color?.name || "Renk"} â€¢ {item.size?.name || "Beden"}
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

                                {/* Footer / Summary */}
                                {cartItems.length > 0 && (
                                    <div className="mt-8 border-t border-gray-100 pt-8">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-gray-600">Ara Toplam</span>
                                            <span className="text-xl font-serif text-black">{formatPriceTRY(totalPrice)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 text-right mb-6">
                                            Vergiler ve kargo Ã¶deme adÄ±mÄ±nda hesaplanÄ±r.
                                        </p>
                                        <div className="flex flex-col gap-3">
                                            <Button
                                                onClick={handleCreateOrder}
                                                className="w-full h-14 rounded-2xl bg-black text-white hover:bg-black/90 text-lg"
                                            >
                                                Sepeti Onayla ve SatÄ±n Al
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push("/")}
                                                className="w-full h-12 rounded-2xl border-gray-200"
                                            >
                                                AlÄ±ÅŸveriÅŸe Devam Et
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Recommended / Recent Tabs */}
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
                                    Ã–zellikle Sizin Ä°Ã§in
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
                                    Son GÃ¶rÃ¼ntÃ¼lenenler
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
                                className="flex gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            >
                                {activeList.map((p) => (
                                    <ProductTile key={p.id} product={p} />
                                ))}
                                {activeList.length === 0 && (
                                    <div className="text-gray-500 py-4 w-full text-center">
                                        Bu kategori iÃ§in Ã¶neri bulunamadÄ±.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
