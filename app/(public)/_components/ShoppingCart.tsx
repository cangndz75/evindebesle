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
    <div className="space-y-1">
      <p className="text-sm font-medium tracking-wide text-black">{title}</p>
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
      className="group block w-[150px] shrink-0"
      aria-label={product.name}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
        <Image
          src={productImage}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          sizes="160px"
          unoptimized
        />
      </div>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 text-xs font-light text-gray-900">{product.name}</p>
        <p className="text-xs font-medium text-black">{formatPriceTRY(product.price)}</p>
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
      // Sepette ürün varsa önce kombin/related dene
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
      // fallback: çok satan / genel liste
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

      // API'den de veri çekmeyi dene (giriş yapmış kullanıcılar için)
      try {
        const res = await fetch("/api/products/recent-views");
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

          // Önce localStorage ürünlerini ekle
          localFormatted.forEach((p: ProductItem) => {
            productMap.set(p.productId, p);
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

  // Önceki ürün ID'lerini takip et (sadece ürün eklendi/silindiğinde öneri yükle)
  const prevProductIdsRef = useRef<string>("");
  const hasLoadedRecommendedRef = useRef(false);

  // Sepet açıldığında cart'ı hydrate et ve company settings yükle
  useEffect(() => {
    if (isOpen) {
      // Cart henüz hydrate edilmemişse hydrate et
      if (!hydrated) {
        hydrate();
      }
      loadCompanySettings();
    } else {
      // Drawer kapandığında resetle
      hasLoadedRecommendedRef.current = false;
      prevProductIdsRef.current = "";
    }
  }, [isOpen, hydrated, hydrate]);

  // Tab değiştiğinde lazy load yap
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === "recent") {
      loadRecentlyViewed();
    } else if (activeTab === "recommended" && !hasLoadedRecommendedRef.current) {
      // Recommended tab'ına ilk kez basıldığında yükle
      const currentProductIds = cartItems.map(item => item.productId).sort().join(",");
      if (currentProductIds !== prevProductIdsRef.current) {
        prevProductIdsRef.current = currentProductIds;
        loadRecommendedProducts(cartItems);
        hasLoadedRecommendedRef.current = true;
      }
    }
  }, [isOpen, activeTab, cartItems]);

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
      {/* Daha "elit" görünüm: hafif geniş, padding ve tipografi */}
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 gap-0 z-[100]">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="px-6 py-5 border-b border-black/5 flex-shrink-0">
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-1">
                <SheetTitle className="text-xl font-normal tracking-tight text-black">
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
          <div className="flex-1 overflow-y-auto px-6 py-6">
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
                  <div className="mb-6 rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-black/5 p-2">
                        <ShoppingBag className="h-4 w-4 text-black" />
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
                    <div className="rounded-3xl border border-black/5 bg-white px-6 py-10 text-center shadow-[0_1px_0_rgba(0,0,0,0.03)]">
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
                    <div className="mt-10">
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

                      <div className="relative mt-6">
                        <div
                          ref={emptySliderRef}
                          className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  <div className="space-y-4 pb-24">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-black/5 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                      >
                        <div className="flex gap-4">
                          <Link
                            href={getProductUrl(item)}
                            onClick={onClose}
                            className="relative h-28 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5"
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
                                  className="block text-sm font-medium text-black hover:underline"
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
                              {/* Quantity stepper (daha elit) */}
                              <div className="inline-flex items-center rounded-full border border-black/10 bg-white">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="h-9 w-10 grid place-items-center rounded-full text-black hover:bg-black/5 disabled:opacity-40 disabled:hover:bg-transparent"
                                  aria-label="Miktarı azalt"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="min-w-[44px] text-center text-sm font-medium text-black">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="h-9 w-10 grid place-items-center rounded-full text-black hover:bg-black/5"
                                  aria-label="Miktarı artır"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-semibold text-black">
                                  {formatPriceTRY((item.product.originalPrice || item.product.price) * item.quantity)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.quantity} adet
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {recommendedProducts.length > 0 ? (
                      <div className="pt-6">
                        <div className="flex items-center justify-between">
                          <SectionTitle
                            title="Bunları da beğenebilirsiniz"
                            subtitle="Görünümünüzü tamamlamak için özenle seçilmiş ürünler"
                          />
                          <div className="hidden sm:flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => scrollSlider(filledRecommendedRef, "left")}
                              className="h-9 w-9 rounded-full border border-black/10 hover:border-black/20 hover:bg-black/5 grid place-items-center"
                              aria-label="Sola kaydır"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollSlider(filledRecommendedRef, "right")}
                              className="h-9 w-9 rounded-full border border-black/10 hover:border-black/20 hover:bg-black/5 grid place-items-center"
                              aria-label="Sağa kaydır"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="relative mt-5">
                          <div
                            ref={filledRecommendedRef}
                            className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            <div className="sticky bottom-0 border-t border-black/5 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Ara Toplam</p>
                  <p className="text-lg font-semibold tracking-tight text-black">
                    {formatPriceTRY(totalPrice)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3">
                  <Button
                    className="w-full h-12 rounded-2xl bg-black text-white hover:bg-black/90"
                    onClick={handleCreateOrder}
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder ? "Yönlendiriliyor..." : "Ödemeye Geç"}
                  </Button>

                  <p className="text-[11px] leading-4 text-gray-500">
                    Vergiler ve kargo ödeme sırasında hesaplanır.
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
