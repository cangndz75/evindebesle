import { create } from "zustand";
import { getGuestCart, addToGuestCart, saveGuestCart, removeFromGuestCart } from "@/lib/cart-utils";

export type CartItem = {
  id: string;
  productId: string;
  colorId: string | null;
  sizeId: string | null;
  quantity: number;
  isGuest?: boolean;
  optimisticId?: string;
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
      images: string[] | string;
    }>;
    sizes: Array<{
      id: string;
      name: string;
    }>;
  };
  color: {
    id: string;
    name: string;
    images: string[] | string;
  } | null;
  size: {
    id: string;
    name: string;
  } | null;
};

type AddItemParams = {
  productId: string;
  colorId: string | null;
  sizeId: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    image: string | null;
    price: number;
  };
  color?: { id: string; name: string } | null;
  size?: { id: string; name: string } | null;
};

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  isReady: boolean; // hydrate tamamlandı ve initial fetch tamamlandı
  setItems: (items: CartItem[]) => void;
  hydrate: () => Promise<void>;
  refreshCart: () => Promise<void>; // API'den cart'ı fetch edip güncelle (hydrate değil)
  syncGuestCartToAPI: () => Promise<void>;
  reset: () => void; // Logout için cart'ı sıfırla
  // Business logic actions - UI sadece bunları çağırır
  addItemOptimistic: (params: AddItemParams) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => Promise<void>;
};

// Guest cart'ı CartItem formatına dönüştür
const formatGuestCart = (guestCart: ReturnType<typeof getGuestCart>): CartItem[] => {
  return guestCart.map((item) => ({
    ...item,
    isGuest: true, // Guest flag ekle
    product: {
      ...item.product,
      slug: null,
      primaryImage: item.product.image,
      colors: [] as Array<{ id: string; name: string; images: string[] | string }>,
      sizes: [] as Array<{ id: string; name: string }>,
    },
    color: item.color ? { ...item.color, images: [] as string[] | string } : null,
    size: item.size || null,
  }));
};

// Debounce timer'ları ve pending update'leri module-level'da tut
const updateTimers = new Map<string, NodeJS.Timeout>();
const pendingUpdates = new Map<string, number>();

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  hydrated: false,
  isReady: false,

  setItems: (items) => set({ items, hydrated: true, isReady: true }),

  reset: () => {
    // Logout için cart'ı sıfırla
    set({
      items: [],
      hydrated: false,
      isReady: false,
    });
    // Guest cart'ı da temizle
    if (typeof window !== "undefined") {
      localStorage.removeItem("guestCart");
    }
  },

  hydrate: async () => {
    // Guard: Zaten hydrate edildiyse tekrar etme
    if (get().hydrated) return;

    // Önce localStorage'dan guest cart'ı göster (anında)
    const guestCart = getGuestCart();
    if (guestCart.length > 0) {
      set({ items: formatGuestCart(guestCart), hydrated: true, isReady: false });
    } else {
      set({ hydrated: true, isReady: false });
    }

    // Sonra backend'den yükle (arka planda)
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const items = await res.json();
        set({ items, hydrated: true, isReady: true });
      } else if (res.status === 401) {
        // Guest kullanıcı - localStorage zaten gösterildi
        if (guestCart.length === 0) {
          set({ items: [], hydrated: true, isReady: true });
        } else {
          set({ hydrated: true, isReady: true });
        }
      } else {
        // Diğer hatalar
        set({ hydrated: true, isReady: true });
      }
    } catch (error) {
      // Network hatası - guest cart zaten gösterildi
      if (guestCart.length === 0) {
        set({ items: [], hydrated: true, isReady: true });
      } else {
        set({ hydrated: true, isReady: true });
      }
    }
  },

  addItemOptimistic: async (params: AddItemParams) => {
    const { productId, colorId, sizeId, quantity, product, color, size } = params;

    // Snapshot: Rollback için önceki state'i kaydet
    const prevItems = [...get().items];
    const prevGuestCart = [...getGuestCart()];

    // Optimistic ID oluştur (yeni item için)
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;

    // OPTİMİSTİK: Store'a geçici item ekle (anında)
    const currentItems = get().items;
    const existingItem = currentItems.find(
      (item) =>
        item.productId === productId &&
        item.colorId === (colorId || null) &&
        item.sizeId === (sizeId || null) &&
        !item.optimisticId // Sadece gerçek item'ları kontrol et
    );

    if (existingItem) {
      // Varsa miktarı artır (optimisticId ekleme, sadece quantity artır)
      set({
        items: currentItems.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      // Yoksa yeni ekle (optimistic)
      const optimisticItem: CartItem = {
        id: optimisticId,
        optimisticId,
        productId,
        colorId,
        sizeId,
        quantity,
        isGuest: true,
        product: {
          id: product.id,
          name: product.name,
          slug: null,
          price: product.price,
          image: product.image,
          primaryImage: product.image,
          colors: [],
          sizes: [],
        },
        color: color ? { id: color.id, name: color.name, images: [] } : null,
        size: size ? { id: size.id, name: size.name } : null,
      };
      set({ items: [...currentItems, optimisticItem] });
    }

    // Guest cart'a ekle (localStorage)
    const guestCart = getGuestCart();
    const existingGuestItem = guestCart.find(
      (item) =>
        item.productId === productId &&
        item.colorId === (colorId || null) &&
        item.sizeId === (sizeId || null)
    );

    if (existingGuestItem) {
      existingGuestItem.quantity += quantity;
      saveGuestCart(guestCart);
    } else {
      addToGuestCart(productId, colorId, sizeId, quantity, product, color, size);
    }

    // UI için event fırlat (CartPreview popup için)
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("itemAddedToCart", {
          detail: {
            product: {
              id: product.id,
              name: product.name,
              image: product.image,
              price: product.price,
            },
            size: size?.name,
            color: color?.name,
          },
        })
      );
    }

    // API isteğini arka planda başlat
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          colorId,
          sizeId,
          quantity,
        }),
      });

      if (res.ok) {
        // Başarılı - API'den güncel cart'ı al (optimistic item otomatik kalkar)
        await get().refreshCart();
      } else if (res.status === 401) {
        // Guest kullanıcı - zaten localStorage'da, sessizce devam et
      } else {
        // Hata - rollback yap (snapshot'tan geri yükle)
        set({ items: prevItems });
        // Guest cart'ı da geri yükle
        if (typeof window !== "undefined") {
          localStorage.setItem("guestCart", JSON.stringify(prevGuestCart));
        }
      }
    } catch (error) {
      // Network hatası - rollback (snapshot'tan geri yükle)
      set({ items: prevItems });
      // Guest cart'ı da geri yükle
      if (typeof window !== "undefined") {
        localStorage.setItem("guestCart", JSON.stringify(prevGuestCart));
      }
      console.error("Error adding item to cart:", error);
    }
  },

  updateQuantity: (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    // OPTİMİSTİK: Store'u anında güncelle
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    }));

    // Pending update'i kaydet
    pendingUpdates.set(itemId, quantity);

    // Önceki timer'ı iptal et
    const existingTimer = updateTimers.get(itemId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Yeni timer başlat (300ms debounce)
    const timer = setTimeout(async () => {
      const finalQuantity = pendingUpdates.get(itemId);
      if (finalQuantity === undefined) return;

      // Guest cart item'ı kontrolü (isGuest flag ile)
      const currentItem = get().items.find((item) => item.id === itemId);
      if (currentItem?.isGuest) {
        try {
          const guestCart = getGuestCart();
          const itemIndex = guestCart.findIndex((item) => item.id === itemId);
          if (itemIndex >= 0) {
            guestCart[itemIndex].quantity = finalQuantity;
            saveGuestCart(guestCart);
            pendingUpdates.delete(itemId);
            // Store'u güncelle
            set({ items: formatGuestCart(guestCart) });
            return;
          }
        } catch (e) {
          console.error("Error updating guest cart:", e);
        }
        pendingUpdates.delete(itemId);
        return;
      }

      // Giriş yapmış kullanıcı için API isteği
      try {
        const res = await fetch(`/api/cart/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: finalQuantity }),
        });

        if (res.ok) {
          pendingUpdates.delete(itemId);
          // API'den güncel cart'ı al
          await get().refreshCart();
        } else if (res.status === 401) {
          // Guest kullanıcı - localStorage'ı güncelle
          try {
            const guestCart = getGuestCart();
            const itemIndex = guestCart.findIndex((item) => item.id === itemId);
            if (itemIndex >= 0) {
              guestCart[itemIndex].quantity = finalQuantity;
              saveGuestCart(guestCart);
              pendingUpdates.delete(itemId);
              set({ items: formatGuestCart(guestCart) });
              return;
            }
          } catch (e) {
            console.error("Error updating guest cart:", e);
          }
          pendingUpdates.delete(itemId);
        } else {
          // Hata - rollback yap
          pendingUpdates.delete(itemId);
          await get().refreshCart();
        }
      } catch (error) {
        // Network hatası - rollback
        pendingUpdates.delete(itemId);
        await get().refreshCart();
      } finally {
        updateTimers.delete(itemId);
      }
    }, 300);

    updateTimers.set(itemId, timer);
  },

  removeItem: async (itemId: string) => {
    // OPTİMİSTİK: Store'u anında güncelle
    const currentItem = get().items.find((item) => item.id === itemId);
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }));

    // Guest cart item'ı kontrolü (isGuest flag ile)
    if (currentItem?.isGuest) {
      try {
        removeFromGuestCart(itemId);
        // Event tetikle
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } catch (e) {
        console.error("Error removing from guest cart:", e);
        // Hata durumunda refresh
        await get().refreshCart();
      }
      return;
    }

    // Giriş yapmış kullanıcı için API isteği
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      if (res.ok) {
        // API'den güncel cart'ı al
        await get().refreshCart();
        // Event tetikle
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } else if (res.status === 401) {
        // Guest kullanıcı - localStorage'dan sil
        try {
          removeFromGuestCart(itemId);
          // Event tetikle
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("cartUpdated"));
          }
        } catch (e) {
          // Sessizce devam et
        }
      } else {
        // Hata - refresh
        await get().refreshCart();
      }
    } catch (error) {
      // Network hatası - refresh
      console.error("Error removing item:", error);
      await get().refreshCart();
    }
  },

  refreshCart: async () => {
    // API'den cart'ı fetch edip güncelle (hydrate değil, sadece refresh)
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const items = await res.json();
        set({ items, isReady: true });
        // Event tetikle
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } else if (res.status === 401) {
        // Guest kullanıcı - localStorage'dan yükle
        const guestCart = getGuestCart();
        if (guestCart.length > 0) {
          set({ items: formatGuestCart(guestCart), isReady: true });
        } else {
          set({ items: [], isReady: true });
        }
        // Event tetikle
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cartUpdated"));
        }
      }
    } catch (error) {
      // Network hatası - mevcut state'i koru
      console.error("Error refreshing cart:", error);
    }
  },

  syncGuestCartToAPI: async () => {
    const guestCart = getGuestCart();
    if (guestCart.length === 0) return;

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

    // Başarılı olanları localStorage'dan kaldır
    if (successCount > 0) {
      if (successCount === guestCart.length) {
        // Tümü başarılı - localStorage'ı temizle
        if (typeof window !== "undefined") {
          localStorage.removeItem("guestCart");
        }
      } else {
        // Bazıları başarısız - sadece başarılı olanları kaldır
        const failedItemIds = results
          .filter((r) => !r.success)
          .map((r) => r.itemId);
        const remainingItems = guestCart.filter(
          (item) => !failedItemIds.includes(item.id)
        );
        if (typeof window !== "undefined") {
          localStorage.setItem("guestCart", JSON.stringify(remainingItems));
        }
      }

      // Sync sonrası mutlaka refreshCart çağır (deterministik state)
      await get().refreshCart();
    }
  },
}));
