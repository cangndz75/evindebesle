import { create } from "zustand";
import { getGuestCart } from "@/lib/cart-utils";

export type CartItem = {
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

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  setItems: (items: CartItem[]) => void;
  hydrate: () => Promise<void>;
  syncGuestCartToAPI: () => Promise<void>;
};

// Guest cart'ı CartItem formatına dönüştür
const formatGuestCart = (guestCart: ReturnType<typeof getGuestCart>): CartItem[] => {
  return guestCart.map((item) => ({
    ...item,
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

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  hydrated: false,

  setItems: (items) => set({ items, hydrated: true }),

  hydrate: async () => {
    // Önce localStorage'dan guest cart'ı göster (anında)
    const guestCart = getGuestCart();
    if (guestCart.length > 0) {
      set({ items: formatGuestCart(guestCart), hydrated: true });
    }

    // Sonra backend'den yükle (arka planda)
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const items = await res.json();
        set({ items, hydrated: true });
        
        // Eğer guest cart varsa senkronize et
        if (guestCart.length > 0) {
          get().syncGuestCartToAPI();
        }
      } else if (res.status === 401) {
        // Guest kullanıcı - localStorage zaten gösterildi
        if (guestCart.length === 0) {
          set({ items: [], hydrated: true });
        }
      }
    } catch (error) {
      // Network hatası - guest cart zaten gösterildi
      if (guestCart.length === 0) {
        set({ items: [], hydrated: true });
      }
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

      // Sepeti yeniden yükle (API'den güncel veri)
      await get().hydrate();
      window.dispatchEvent(new Event("cartUpdated"));
    }
  },
}));
