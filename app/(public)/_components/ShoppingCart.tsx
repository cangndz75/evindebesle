"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, ChevronLeft, ChevronRight, Tag, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type ShoppingCartProps = {
  isOpen: boolean;
  onClose: () => void;
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
    <div className="space-y-0.5">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
    </div>
  );
}

function ProductTile({
  product,
  onClick,
}: {
  product: RecommendedProduct;
  onClick: () => void;
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
      className="group block w-[112px] shrink-0"
      aria-label={product.name}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-[#f5f5f5] ring-1 ring-black/5">
        <Image
          src={productImage}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          sizes="112px"
          unoptimized
        />
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="line-clamp-2 text-[12px] leading-4 font-medium text-[#222]">{product.name}</p>
        <p className="text-[12px] font-semibold text-[#1a1a1a]">{formatPriceTRY(product.price)}</p>
      </div>
    </Link>
  );
}

export default function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
  const { data: session } = useSession();

  // Store'dan cart items, state ve actions al
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
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const router = useRouter();

  const emptySliderRef = useRef<HTMLDivElement | null>(null);
  const filledRecommendedRef = useRef<HTMLDivElement | null>(null);

  const scrollSlider = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = 320;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const handleCreateOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Sepetiniz boş");
      return;
    }

    // Önce kullanıcının giriş yapıp yapmadığını kontrol et (setIsCreatingOrder'dan önce)
    const addressesRes = await fetch("/api/user-addresses");

    // 401 hatası = giriş yapmamış kullanıcı - direkt yönlendir, loading gösterme
    if (addressesRes.status === 401) {
      // Sepeti localStorage'da tut (zaten tutuluyor ama emin olmak için)
      // Sepeti kapat ve auth-tabs'e yönlendir
      onClose();
      router.push("/auth-tabs");
      return;
    }

    try {
      // Direct order creation via /api/orders is disabled for public users
      // to enforce stock reservation and regular checkout flow.
      // We redirect to the checkout summary page instead.
      onClose();
      router.push("/checkout/summary");
    } catch (error: any) {
      console.error("Order creation error:", error);
      // 401 hatası zaten handle edildi, diğer hatalar için mesaj göster
      if (!error.message?.includes('401')) {
        toast.error(error.message || "Sipariş oluşturulurken bir hata oluştu");
      }
    } finally {
      setIsCreatingOrder(false);
    }
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
      const productIds = items.map((i) => i.productId);
      // API artık cinsiyet+kategori bazlı akıllı fallback yapıyor
      const res = await fetch(`/api/products/recommended?productIds=${productIds.join(",")}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendedProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading recommended products:", error);
    }
  };

  const loadRecentlyViewed = async () => {
    try {
      // Önce localStorage'dan veri çek
      const localProducts = getRecentlyViewed();

      // localStorage'dan gelen ürünleri formatla
      const localFormatted = localProducts.map((p) => ({
        id: p.id,
        productId: p.productId,
        name: p.name,
        slug: p.slug || null,
        price: p.price,
        image: p.image || p.primaryImage || null,
        primaryImage: p.primaryImage || p.image || null,
        colors: [],
      }));

      // API'den de veri çekmeyi dene (giriş yapmış kullanıcılar için veya guest için DB validasyonu)
      try {
        const productIds = localFormatted.map(p => p.productId).filter(Boolean).join(",");
        const url = productIds ? `/api/products/recent-views?ids=${productIds}` : "/api/products/recent-views";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const apiProducts = Array.isArray(data?.products) ? data.products : [];

          // API'den gelen ürünleri formatla
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

          const apiProductIds = new Set(apiFormatted.map((p: any) => p.productId));

          // API ve localStorage ürünlerini birleştir
          // Aynı ürün varsa API'den geleni önceliklendir (daha güncel)
          type ProductItem = {
            id: string;
            productId: string;
            name: string;
            slug: string | null;
            price: number;
            image: string | null;
            primaryImage: string | null;
            colors: any[];
          };
          const productMap = new Map<string, ProductItem>();

          // Önce localStorage ürünlerini EĞER API'de geçerliyse (silinmemişse) ekle
          localFormatted.forEach((p: ProductItem) => {
            if (apiProductIds.has(p.productId)) {
              productMap.set(p.productId, p);
            }
          });

          // Sonra API ürünlerini ekle (aynı ürün varsa üzerine yaz)
          apiFormatted.forEach((p: ProductItem) => {
            productMap.set(p.productId, p);
          });

          // Map'ten array'e çevir (zaten sıralı - en yeni önce)
          const combined = Array.from(productMap.values());
          // En fazla 12 ürün göster
          setRecentlyViewedProducts(combined.slice(0, 12));
        } else {
          // API başarısız olursa sadece localStorage kullan
          setRecentlyViewedProducts(localFormatted.slice(0, 12));
        }
      } catch (apiError) {
        // API hatası olursa sadece localStorage kullan
        console.error("Error fetching API recent views:", apiError);
        setRecentlyViewedProducts(localFormatted.slice(0, 12));
      }
    } catch (error) {
      console.error("Error loading recently viewed products:", error);
      setRecentlyViewedProducts([]);
    }
  };

  // Son öneri isteğinin anahtarı (gereksiz tekrar fetch'i engelle)
  const lastRecommendedKeyRef = useRef<string>("");

  // Sepet açıldığında cart'ı hydrate et ve company settings yükle
  useEffect(() => {
    if (isOpen) {
      // Cart henüz hydrate edilmemişse hydrate et
      if (!hydrated) {
        hydrate();
      }
      loadCompanySettings();
    }
  }, [isOpen, hydrated, hydrate]);

  // Sepet değiştiğinde önerileri arka planda preload et
  useEffect(() => {
    if (!cartItems.length) {
      lastRecommendedKeyRef.current = "";
      return;
    }

    const key = cartItems.map((item) => item.productId).sort().join(",");
    if (key === lastRecommendedKeyRef.current) return;

    lastRecommendedKeyRef.current = key;
    loadRecommendedProducts(cartItems);
  }, [cartItems]);

  // Tab değiştiğinde lazy load yap
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === "recent") {
      loadRecentlyViewed();
    } else if (activeTab === "recommended" && cartItems.length === 0 && recommendedProducts.length === 0) {
      // Empty cart senaryosunda öneri tab'ını ilk açışta yükle
      loadRecommendedProducts([]);
    }
  }, [isOpen, activeTab, cartItems, recommendedProducts.length]);

  // Event listener: recentlyViewedUpdated event'i için
  useEffect(() => {
    if (!isOpen) return;

    const handleRecentlyViewedUpdated = () => {
      if (activeTab === "recent") {
        loadRecentlyViewed();
      }
    };

    window.addEventListener("recentlyViewedUpdated", handleRecentlyViewedUpdated);
    return () => window.removeEventListener("recentlyViewedUpdated", handleRecentlyViewedUpdated);
  }, [isOpen, activeTab]);


  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = item.product.originalPrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);
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
    // Önce seçili renk resimlerini kontrol et
    if (item.color?.images) {
      let colorImages: string[] = [];
      // images string olabilir (JSON string)
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

    // Ürünün renklerinden ilk resmi al
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

    // Fallback: product.image (guest cart için önemli)
    return item.product.primaryImage || item.product.image || "/placeholder.jpg";
  };

  const getProductUrl = (item: CartItem) => {
    if (item.product.slug) return `/products/${item.product.slug}`;
    return `/product/${item.product.id}`;
  };


  const activeList = activeTab === "recommended" ? recommendedProducts : recentlyViewedProducts;
  const itemCount = cartItems.reduce((acc, it) => acc + (it.quantity || 0), 0);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0 z-[100] bg-white">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="px-5 py-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-1">
                <SheetTitle className="text-base font-semibold tracking-wide uppercase text-gray-800">
                  Sepetim
                </SheetTitle>
                <p className="text-xs text-gray-500">
                  {cartItems.length > 0 ? `${itemCount} ürün` : "Henüz ürün yok"}
                </p>
              </div>
              {/* Close, Sheet zaten X ikon koyuyor olabilir. İstersen buraya ekstra koyma */}
            </div>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-white">
            {/* Empty Cart Skeleton - Sadece isReady değilse göster */}
            {!isReady && cartItems.length === 0 ? (
              <div className="space-y-4 py-4">
                {/* Skeleton items */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-24 w-24 shrink-0 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-gray-100" />
                      <div className="h-3 w-1/2 rounded bg-gray-100" />
                      <div className="h-3 w-1/3 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* FREE SHIPPING BAR (only meaningful when cart has items) */}
                {cartItems.length > 0 ? (
                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 rounded-md bg-white p-1.5 border border-gray-200">
                        <ShoppingBag className="h-4 w-4 text-black" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <p className="text-sm text-gray-700 leading-5">
                          {qualifiesForFreeShipping ? (
                            <span className="font-semibold text-black">
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
                        {!qualifiesForFreeShipping ? (
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full bg-black transition-all duration-300"
                              style={{ width: `${freeShippingProgress}%` }}
                            />
                          </div>
                        ) : (
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full bg-black" style={{ width: "100%" }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* EMPTY STATE (2. görsel hissi) */}
                {cartItems.length === 0 ? (
                  <div className="pb-4">
                    <div className="rounded-xl border border-black/10 bg-white px-6 py-10 text-center">
                      <p className="text-xl font-semibold tracking-tight text-black">
                        Sepetiniz Boş
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Ürünlere göz atın ve favorilerinizi sepete ekleyin.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-6 h-12 rounded-xl border-black text-black hover:bg-black hover:text-white px-8"
                        onClick={onClose}
                      >
                        Alışverişe Devam Et
                      </Button>
                    </div>

                    {/* Tabs + Slider */}
                    <div className="mt-8">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-8 border-b border-black/10 w-full">
                          <button
                            onClick={() => setActiveTab("recommended")}
                            className={[
                              "pb-3 text-sm font-medium transition-colors",
                              activeTab === "recommended"
                                ? "text-black border-b-2 border-black"
                                : "text-gray-500 hover:text-black",
                            ].join(" ")}
                          >
                            Özellikle Sizin İçin
                          </button>
                          <button
                            onClick={() => setActiveTab("recent")}
                            className={[
                              "pb-3 text-sm font-medium transition-colors",
                              activeTab === "recent"
                                ? "text-black border-b-2 border-black"
                                : "text-gray-500 hover:text-black",
                            ].join(" ")}
                          >
                            Son Görüntülenenler
                          </button>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => scrollSlider(emptySliderRef, "left")}
                            className="h-9 w-9 rounded-full border border-black/10 hover:border-black/20 hover:bg-black/5 grid place-items-center"
                            aria-label="Sola kaydır"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollSlider(emptySliderRef, "right")}
                            className="h-9 w-9 rounded-full border border-black/10 hover:border-black/20 hover:bg-black/5 grid place-items-center"
                            aria-label="Sağa kaydır"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="relative mt-4">
                        <div
                          ref={emptySliderRef}
                          className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                          {activeList.slice(0, 10).map((p) => (
                            <ProductTile key={p.id} product={p} onClick={onClose} />
                          ))}
                          {activeList.length === 0 ? (
                            <div className="text-sm text-gray-500 py-6">
                              Gösterilecek ürün yok.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* FILLED CART (1. görselin modern/elit versiyonu) */}
                {cartItems.length > 0 ? (
                  <div className="space-y-0 pb-24">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="border-b border-gray-200 py-4"
                      >
                        <div className="flex gap-4">
                          <Link
                            href={getProductUrl(item)}
                            onClick={onClose}
                            className="relative h-24 w-16 shrink-0 overflow-hidden rounded bg-gray-50"
                          >
                            <Image
                              src={getProductImage(item)}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="96px"
                              unoptimized
                            />
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <Link
                                  href={getProductUrl(item)}
                                  onClick={onClose}
                                  className="block text-sm font-medium text-gray-900 hover:underline"
                                  title={item.product.name}
                                >
                                  {item.product.name}
                                </Link>
                                <p className="mt-1 text-xs text-gray-500">
                                  {item.color?.name || "Renk"} · {item.size?.name || "Beden"}
                                </p>
                              </div>

                              <button
                                onClick={() => removeItem(item.id)}
                                className="rounded-xl p-2 text-gray-400 hover:text-black hover:bg-black/5 transition-colors"
                                aria-label="Ürünü kaldır"
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <div className="inline-flex items-center rounded-md border border-gray-300 bg-white">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="h-8 w-8 grid place-items-center text-black hover:bg-black/5 disabled:opacity-40 disabled:hover:bg-transparent"
                                  aria-label="Miktarı azalt"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="min-w-[30px] text-center text-sm font-medium text-black">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="h-8 w-8 grid place-items-center text-black hover:bg-black/5"
                                  aria-label="Miktarı artır"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-base font-semibold text-gray-900">
                                  {formatPriceTRY((item.product.originalPrice || item.product.price) * item.quantity)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {item.quantity} adet
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {recommendedProducts.length > 0 ? (
                      <div className="pt-5 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <SectionTitle
                            title="Bunları da beğenebilirsiniz"
                            subtitle="Kombininizi tamamlayın"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => scrollSlider(filledRecommendedRef, "left")}
                              className="h-7 w-7 rounded-full border border-gray-300 bg-white hover:bg-gray-50 grid place-items-center"
                              aria-label="Sola kaydır"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollSlider(filledRecommendedRef, "right")}
                              className="h-7 w-7 rounded-full border border-gray-300 bg-white hover:bg-gray-50 grid place-items-center"
                              aria-label="Sağa kaydır"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="relative mt-3">
                          <div
                            ref={filledRecommendedRef}
                            className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          >
                            {recommendedProducts.slice(0, 12).map((p) => (
                              <ProductTile key={p.id} product={p} onClick={onClose} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Sticky Footer (elit checkout bar) */}
          {cartItems.length > 0 ? (
            <div className="sticky bottom-0 border-t border-gray-200 bg-white">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-wide text-gray-500">Ara Toplam</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatPriceTRY(totalPrice)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3">
                  <Button
                    className="w-full h-12 rounded-full bg-black text-white hover:bg-black/90 tracking-wide text-sm"
                    onClick={handleCreateOrder}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder ? "Yönlendiriliyor..." : "ÖDEMEYE GEÇ"}
                  </Button>

                  <p className="text-[11px] leading-4 text-gray-400 text-center">
                    KDV dahildir · Kargo ücreti ödeme adımında hesaplanır
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
