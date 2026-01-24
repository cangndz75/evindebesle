"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getGuestCart, saveGuestCart, removeFromGuestCart } from "@/lib/cart-utils";
import { getRecentlyViewed } from "@/lib/recently-viewed";

type CartItem = {
  id: string;
  productId: string;
  colorId: string | null;
  sizeId: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string | null;
    price: number;
    image: string | null;
    primaryImage: string | null;
    colors: Array<{
      id: string;
      name: string;
      images: string[];
    }>;
    sizes: Array<{
      id: string;
      name: string;
    }>;
  };
  color: {
    id: string;
    name: string;
    images: string[];
  } | null;
  size: {
    id: string;
    name: string;
  } | null;
};

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
  // Basit, güvenli format. İstersen Intl ile de yaparsın.
  return `${value.toFixed(2)} ₺`;
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(99);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<RecommendedProduct[]>([]);
  const [activeTab, setActiveTab] = useState<"recommended" | "recent">("recommended");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const router = useRouter();

  const sliderRef = useRef<HTMLDivElement | null>(null);
  
  // Debounce timer'ları ve pending işlemleri takip et
  const updateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingUpdates = useRef<Map<string, number>>(new Map());

  // Senkronizasyon durumunu takip et (sonsuz döngüyü önlemek için)
  const isSyncingRef = useRef(false);
  const hasSyncedRef = useRef(false); // Sadece bir kez senkronize et

  // localStorage'daki guest cart'ı API'ye senkronize et (giriş yapıldığında)
  const syncGuestCartToAPI = async () => {
    // Eğer zaten senkronizasyon yapılıyorsa veya daha önce yapıldıysa, tekrar başlatma
    if (isSyncingRef.current || hasSyncedRef.current) {
      return;
    }
    
    isSyncingRef.current = true;
    try {
      const guestCart = getGuestCart();
      if (guestCart.length === 0) {
        hasSyncedRef.current = true; // Boş sepet için de flag'i set et
        return; // Sepet boşsa işlem yapma
      }

      // Her bir item'ı API'ye ekle
      const syncPromises = guestCart.map(async (item) => {
        try {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: item.productId,
              colorId: item.colorId,
              sizeId: item.sizeId,
              quantity: item.quantity,
            }),
          });

          if (res.ok) {
            return { success: true, itemId: item.id };
          } else {
            console.error(`Failed to sync item ${item.id}:`, await res.json());
            return { success: false, itemId: item.id };
          }
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
          return { success: false, itemId: item.id };
        }
      });

      const results = await Promise.all(syncPromises);
      const successCount = results.filter((r) => r.success).length;

      // Eğer tüm item'lar başarıyla senkronize edildiyse localStorage'ı temizle
      if (successCount === guestCart.length) {
        // localStorage'ı temizle
        if (typeof window !== "undefined") {
          localStorage.removeItem("guestCart");
        }
        // Sepet güncelleme event'ini tetikle
        window.dispatchEvent(new Event("cartUpdated"));
        // loadCart'ı çağıran yerde zaten yüklenecek, burada tekrar çağırmaya gerek yok
      } else {
        // Bazı item'lar başarısız oldu, sadece başarılı olanları localStorage'dan kaldır
        const failedItemIds = results
          .filter((r) => !r.success)
          .map((r) => r.itemId);
        
        if (failedItemIds.length < guestCart.length) {
          // Başarılı olanları localStorage'dan kaldır
          const remainingItems = guestCart.filter(
            (item) => !failedItemIds.includes(item.id)
          );
          if (typeof window !== "undefined") {
            localStorage.setItem("guestCart", JSON.stringify(remainingItems));
          }
          // Sepet güncelleme event'ini tetikle
          window.dispatchEvent(new Event("cartUpdated"));
        }
      }
      
      // Senkronizasyon tamamlandı, flag'i set et
      hasSyncedRef.current = true;
    } catch (error) {
      console.error("Error syncing guest cart to API:", error);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const loadCart = async (skipPendingCheck = false) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        
        // Eğer giriş yapılmışsa ve localStorage'da guest cart varsa senkronize et
        // (Sadece bir kez, senkronizasyon yapılmıyorsa ve daha önce yapılmadıysa)
        if (!isSyncingRef.current && !hasSyncedRef.current) {
          const guestCart = getGuestCart();
          if (guestCart.length > 0) {
            // Arka planda senkronize et (await yok - beklemeden devam et)
            syncGuestCartToAPI().catch((error) => {
              console.error("Error syncing guest cart:", error);
            });
          } else {
            // Guest cart boşsa da flag'i set et (tekrar kontrol etmeye gerek yok)
            hasSyncedRef.current = true;
          }
        }
        
        // Eğer pending update varsa, onu koru
        if (!skipPendingCheck && pendingUpdates.current.size > 0) {
          setCartItems((prevItems) => {
            return items.map((item: CartItem) => {
              const pendingQty = pendingUpdates.current.get(item.id);
              if (pendingQty !== undefined) {
                return { ...item, quantity: pendingQty };
              }
              return item;
            });
          });
        } else {
          setCartItems(items);
        }
      } else if (res.status === 401) {
        // Guest kullanıcı için localStorage'dan yükle (sessizce, hata gösterme)
        try {
          const items = getGuestCart();
          // GuestCartItem'ı CartItem formatına dönüştür
          const formattedItems: CartItem[] = items.map((item) => ({
            ...item,
            product: {
              ...item.product,
              slug: null,
              primaryImage: item.product.image,
              colors: [],
              sizes: [],
            },
            color: item.color ? { ...item.color, images: [] } : null,
            size: item.size || null,
          }));
          setCartItems(formattedItems);
        } catch (e) {
          setCartItems([]);
        }
      } else {
        // Diğer hatalar için guest cart'ı dene
        try {
          const items = getGuestCart();
          const formattedItems: CartItem[] = items.map((item) => ({
            ...item,
            product: {
              ...item.product,
              slug: null,
              primaryImage: item.product.image,
              colors: [],
              sizes: [],
            },
            color: item.color ? { ...item.color, images: [] } : null,
            size: item.size || null,
          }));
          setCartItems(formattedItems);
        } catch (e) {
          setCartItems([]);
        }
      }
    } catch (error) {
      // Network hatası veya diğer hatalar için guest cart'ı dene (sessizce)
      try {
        const items = getGuestCart();
        const formattedItems: CartItem[] = items.map((item) => ({
          ...item,
          product: {
            ...item.product,
            slug: null,
            primaryImage: item.product.image,
            colors: [],
            sizes: [],
          },
          color: item.color ? { ...item.color, images: [] } : null,
          size: item.size || null,
        }));
        setCartItems(formattedItems);
      } catch (e) {
        setCartItems([]);
      }
    } finally {
      setIsLoading(false);
    }
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
      setIsCreatingOrder(true);

      if (!addressesRes.ok) {
        throw new Error("Adresler yüklenemedi");
      }

      const addresses = await addressesRes.json();
      if (!addresses || addresses.length === 0) {
        toast.error("Lütfen önce bir teslimat adresi ekleyin");
        router.push("/profile/addresses");
        onClose();
        return;
      }

      // İlk adresi kullan (test için)
      const shippingAddressId = addresses[0].id;

      // Sipariş oluştur
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddressId,
          billingAddressId: shippingAddressId,
          customerNote: "Test siparişi",
          paymentMethod: "TEST",
        }),
      });

      if (!orderRes.ok) {
        const error = await orderRes.json();
        throw new Error(error.error || "Sipariş oluşturulamadı");
      }

      const result = await orderRes.json();
      toast.success(`Siparişiniz oluşturuldu! Sipariş No: ${result.order.orderNumber}`);
      
      // Sepeti temizle ve kapat
      setCartItems([]);
      onClose();
      
      // Siparişlerim sayfasına yönlendir
      router.push("/profile/orders");
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
  const isInitialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    if (!isOpen) {
      // Sepet kapandığında ref'leri sıfırla
      prevProductIdsRef.current = "";
      isInitialLoadRef.current = true;
      hasSyncedRef.current = false; // Bir sonraki açılışta tekrar kontrol et
      return;
    }
    
    // Açılınca temel dataları çek
    loadCart();
    loadCompanySettings();
    // Son görüntülenenler sadece tab'a basınca yüklenecek (performans için)
    
    // Cleanup: Timer'ları temizle
    return () => {
      updateTimers.current.forEach((timer) => clearTimeout(timer));
      updateTimers.current.clear();
      pendingUpdates.current.clear();
    };
  }, [isOpen]);

  // Tab değiştiğinde "Son Görüntülenenler" tab'ına basıldıysa dinamik yükle
  useEffect(() => {
    if (isOpen && activeTab === "recent") {
      loadRecentlyViewed();
    }
  }, [isOpen, activeTab]);

  // Event listener: recentlyViewedUpdated event'i için
  useEffect(() => {
    if (!isOpen) return;
    
    const handleRecentlyViewedUpdated = () => {
      // Eğer "Son Görüntülenenler" tab'ı aktifse, listeyi yeniden yükle
      if (activeTab === "recent") {
        loadRecentlyViewed();
      }
    };

    window.addEventListener("recentlyViewedUpdated", handleRecentlyViewedUpdated);
    
    return () => {
      window.removeEventListener("recentlyViewedUpdated", handleRecentlyViewedUpdated);
    };
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) return;
    
    // Sadece ürün ID'leri değiştiğinde öneri yükle (miktar değişikliklerinde değil)
    const currentProductIds = cartItems.map(item => item.productId).sort().join(",");
    
    // İlk yüklemede veya ürün ID'leri değiştiğinde yükle
    if (isInitialLoadRef.current || prevProductIdsRef.current !== currentProductIds) {
      isInitialLoadRef.current = false;
      prevProductIdsRef.current = currentProductIds;
      loadRecommendedProducts(cartItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cartItems]);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // UI'ı anında güncelle (optimistik güncelleme - functional update)
    setCartItems((prevItems) => {
      const item = prevItems.find((i) => i.id === itemId);
      if (!item) return prevItems;
      
      // Yeni quantity'yi kaydet
      pendingUpdates.current.set(itemId, newQuantity);
      
      return prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
    });

    // Önceki timer'ı iptal et
    const existingTimer = updateTimers.current.get(itemId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Yeni timer başlat (300ms debounce)
    const timer = setTimeout(async () => {
      const finalQuantity = pendingUpdates.current.get(itemId);
      if (finalQuantity === undefined) return;

      // Guest cart item'ı kontrolü - "guest-" ile başlıyorsa direkt localStorage'a yaz
      if (itemId.startsWith("guest-")) {
        try {
          const guestCart = getGuestCart();
          const itemIndex = guestCart.findIndex((item) => item.id === itemId);
          if (itemIndex >= 0) {
            guestCart[itemIndex].quantity = finalQuantity;
            saveGuestCart(guestCart);
            pendingUpdates.current.delete(itemId);
            window.dispatchEvent(new Event("cartUpdated"));
            return; // Başarılı, API isteği yapma
          }
        } catch (e) {
          console.error("Error updating guest cart:", e);
          pendingUpdates.current.delete(itemId);
        }
        return;
      }

      // Giriş yapmış kullanıcı için API isteği
      try {
        const res = await fetch(`/api/cart/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: finalQuantity }),
        });

        if (!res.ok) {
          // 401 hatası = giriş yapmamış kullanıcı, localStorage'ı güncelle
          if (res.status === 401) {
            try {
              const guestCart = getGuestCart();
              const itemIndex = guestCart.findIndex((item) => item.id === itemId);
              if (itemIndex >= 0) {
                guestCart[itemIndex].quantity = finalQuantity;
                saveGuestCart(guestCart);
                pendingUpdates.current.delete(itemId);
                window.dispatchEvent(new Event("cartUpdated"));
                return; // Başarılı, devam etme
              }
            } catch (e) {
              console.error("Error updating guest cart:", e);
            }
          }
          
          // Diğer hatalar için
          pendingUpdates.current.delete(itemId);
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error || "Miktar güncellenirken bir hata oluştu";
          toast.error(errorMessage);
          console.error("Error updating quantity:", errorMessage);
          loadCart(true);
        } else {
          // Başarılı - pending'i temizle
          pendingUpdates.current.delete(itemId);
          // Arka planda sepeti güncelle (senkronizasyon için, pending check'i atla)
          loadCart(true);
        }
      } catch (error) {
        // 401 hatası = giriş yapmamış kullanıcı, localStorage'ı güncelle
        if (error instanceof Error && error.message.includes('401')) {
          try {
            const guestCart = getGuestCart();
            const itemIndex = guestCart.findIndex((item) => item.id === itemId);
            if (itemIndex >= 0) {
              guestCart[itemIndex].quantity = finalQuantity;
              saveGuestCart(guestCart);
              pendingUpdates.current.delete(itemId);
              window.dispatchEvent(new Event("cartUpdated"));
              return; // Başarılı, devam etme
            }
          } catch (e) {
            console.error("Error updating guest cart:", e);
          }
        }
        
        // Diğer hatalar için
        pendingUpdates.current.delete(itemId);
        const errorMessage = error instanceof Error ? error.message : "Miktar güncellenirken bir hata oluştu";
        toast.error(errorMessage);
        console.error("Error updating quantity:", error);
        loadCart();
      } finally {
        updateTimers.current.delete(itemId);
      }
    }, 300);

    updateTimers.current.set(itemId, timer);
  };

  const removeItem = async (itemId: string) => {
    // Guest cart item'ı kontrolü - "guest-" ile başlıyorsa direkt localStorage'dan sil
    if (itemId.startsWith("guest-")) {
      try {
        removeFromGuestCart(itemId);
        const items = getGuestCart();
        // GuestCartItem'ı CartItem formatına dönüştür
        const formattedItems: CartItem[] = items.map((item) => ({
          ...item,
          product: {
            ...item.product,
            slug: null,
            primaryImage: item.product.image,
            colors: [],
            sizes: [],
          },
          color: item.color ? { ...item.color, images: [] } : null,
          size: item.size || null,
        }));
        setCartItems(formattedItems);
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (e) {
        console.error("Error removing from guest cart:", e);
      }
      return;
    }

    // Giriş yapmış kullanıcı için API isteği
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      if (res.ok) {
        loadCart();
        window.dispatchEvent(new Event("cartUpdated"));
      } else if (res.status === 401) {
        // Guest kullanıcı için localStorage'dan sil
        try {
          removeFromGuestCart(itemId);
          const items = getGuestCart();
          // GuestCartItem'ı CartItem formatına dönüştür
          const formattedItems: CartItem[] = items.map((item) => ({
            ...item,
            product: {
              ...item.product,
              slug: null,
              primaryImage: item.product.image,
              colors: [],
              sizes: [],
            },
            color: item.color ? { ...item.color, images: [] } : null,
            size: item.size || null,
          }));
          setCartItems(formattedItems);
          window.dispatchEvent(new Event("cartUpdated"));
        } catch (e) {
          // Sessizce devam et
        }
      }
    } catch (error) {
      // 401 hatası zaten handle edildi, diğer hatalar için sessizce devam et
      if (error instanceof Error && !error.message.includes('401')) {
        // Guest cart'tan silmeyi dene
        try {
          removeFromGuestCart(itemId);
          const items = getGuestCart();
          // GuestCartItem'ı CartItem formatına dönüştür
          const formattedItems: CartItem[] = items.map((item) => ({
            ...item,
            product: {
              ...item.product,
              slug: null,
              primaryImage: item.product.image,
              colors: [],
              sizes: [],
            },
            color: item.color ? { ...item.color, images: [] } : null,
            size: item.size || null,
          }));
          setCartItems(formattedItems);
          window.dispatchEvent(new Event("cartUpdated"));
        } catch (e) {
          // Sessizce devam et
        }
      }
    }
  };

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

  const scrollSlider = (dir: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;
    const amount = 320;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const activeList = activeTab === "recommended" ? recommendedProducts : recentlyViewedProducts;
  const itemCount = cartItems.reduce((acc, it) => acc + (it.quantity || 0), 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
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
            {/* Loading */}
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-5 w-40 rounded bg-gray-100" />
                <div className="h-28 rounded-2xl bg-gray-100" />
                <div className="h-28 rounded-2xl bg-gray-100" />
                <div className="h-28 rounded-2xl bg-gray-100" />
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
                            onClick={() => scrollSlider("left")}
                            className="h-9 w-9 rounded-full border border-black/10 hover:border-black/20 hover:bg-black/5 grid place-items-center"
                            aria-label="Sola kaydır"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollSlider("right")}
                            className="h-9 w-9 rounded-full border border-black/10 hover:border-black/20 hover:bg-black/5 grid place-items-center"
                            aria-label="Sağa kaydır"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="relative mt-6">
                        <div
                          ref={sliderRef}
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
                                  {formatPriceTRY(item.product.price * item.quantity)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatPriceTRY(item.product.price)} adet
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
                              onClick={() => scrollSlider("left")}
                              className="h-9 w-9 rounded-full border border-black/10 hover:border-black/20 hover:bg-black/5 grid place-items-center"
                              aria-label="Sola kaydır"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollSlider("right")}
                              className="h-9 w-9 rounded-full border border-black/10 hover:border-black/20 hover:bg-black/5 grid place-items-center"
                              aria-label="Sağa kaydır"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="relative mt-5">
                          <div
                            ref={sliderRef}
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
                    {isCreatingOrder ? "Sipariş Oluşturuluyor..." : "Sipariş Ver"}
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
