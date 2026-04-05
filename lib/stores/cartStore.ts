import { create } from "zustand";
import { getGuestCart, addToGuestCart, saveGuestCart } from "@/lib/cart-utils";

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
    originalPrice?: number | null;
    image: string | null;
    primaryImage: string | null;
    categoryId?: string | null;
    gender?: string | null;
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
    originalPrice?: number | null;
    categoryId?: string | null;
    gender?: string | null;
  };
  color?: { id: string; name: string } | null;
  size?: { id: string; name: string } | null;
};

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  isReady: boolean; // hydrate tamamlandı ve initial fetch tamamlandı
  couponCode: string | null;
  discountAmount: number;
  setItems: (items: CartItem[]) => void;
  hydrate: () => Promise<void>;
  refreshCart: () => Promise<void>; // API'den cart'ı fetch edip güncelle (hydrate değil)
  syncGuestCartToAPI: () => Promise<void>;
  reset: () => void; // Logout için cart'ı sıfırla
  addItemOptimistic: (params: AddItemParams) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  clearCart: () => void;
};

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

const updateTimers = new Map<string, NodeJS.Timeout>();
const pendingUpdates = new Map<string, number>();

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  hydrated: false,
  isReady: false,
  couponCode: null,
  discountAmount: 0,

  setItems: (items) => set({ items, hydrated: true, isReady: true }),

  reset: () => {
    set({
      items: [],
      hydrated: false,
      isReady: false,
      couponCode: null,
      discountAmount: 0,
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem("guestCart");
      window.dispatchEvent(new Event("cartUpdated"));
    }
  },

  clearCart: () => {
    set({
      items: [],
      hydrated: true,
      isReady: true,
      couponCode: null,
      discountAmount: 0,
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem("guestCart");
      window.dispatchEvent(new Event("cartUpdated"));
    }
  },

  hydrate: async () => {
    if (get().hydrated) return;

    const guestCart = getGuestCart();
    if (guestCart.length > 0) {
      set({ items: formatGuestCart(guestCart), hydrated: true, isReady: false });
    } else {
      set({ hydrated: true, isReady: false });
    }

    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const items = await res.json();
        if (typeof window !== "undefined") {
          localStorage.removeItem("guestCart");
        }
        set({ items, hydrated: true, isReady: true });
      } else if (res.status === 401) {
        if (guestCart.length === 0) {
          set({ items: [], hydrated: true, isReady: true });
        } else {
          set({ hydrated: true, isReady: true });
        }
      } else {
        set({ hydrated: true, isReady: true });
      }
    } catch (error) {
      if (guestCart.length === 0) {
        set({ items: [], hydrated: true, isReady: true });
      } else {
        set({ hydrated: true, isReady: true });
      }
    }
  },

  addItemOptimistic: async (params: AddItemParams) => {
    const { productId, colorId, sizeId, quantity, product, color, size } = params;

    const prevItems = [...get().items];

    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;

    const currentItems = get().items;
    const existingItem = currentItems.find(
      (item) =>
        item.productId === productId &&
        item.colorId === (colorId || null) &&
        item.sizeId === (sizeId || null) &&
        !item.optimisticId // Sadece gerçek item'ları kontrol et
    );

    if (existingItem) {
      set({
        items: currentItems.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
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
          originalPrice: product.originalPrice,
          image: product.image,
          primaryImage: product.image,
          categoryId: product.categoryId,
          gender: product.gender,
          colors: [],
          sizes: [],
        },
        color: color ? { id: color.id, name: color.name, images: [] } : null,
        size: size ? { id: size.id, name: size.name } : null,
      };
      set({ items: [...currentItems, optimisticItem] });
    }

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
        await get().refreshCart();
      } else if (res.status === 401) {
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

        const syncedGuestCart = getGuestCart();
        set({ items: formatGuestCart(syncedGuestCart), hydrated: true, isReady: true });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } else {
        set({ items: prevItems });
      }
    } catch (error) {
      set({ items: prevItems });
      console.error("Error adding item to cart:", error);
    }
  },

  updateQuantity: (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    }));

    pendingUpdates.set(itemId, quantity);

    const existingTimer = updateTimers.get(itemId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      const finalQuantity = pendingUpdates.get(itemId);
      if (finalQuantity === undefined) return;

      const currentItem = get().items.find((item) => item.id === itemId);
      if (currentItem?.isGuest) {
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
        return;
      }

      try {
        const res = await fetch(`/api/cart/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: finalQuantity }),
        });

        if (res.ok) {
          pendingUpdates.delete(itemId);
          await get().refreshCart();
        } else if (res.status === 401) {
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
          pendingUpdates.delete(itemId);
          await get().refreshCart();
        }
      } catch (error) {
        pendingUpdates.delete(itemId);
        await get().refreshCart();
      } finally {
        updateTimers.delete(itemId);
      }
    }, 300);

    updateTimers.set(itemId, timer);
  },

  removeItem: async (itemId: string) => {
    const currentItem = get().items.find((item) => item.id === itemId);
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }));

    if (currentItem?.isGuest) {
      try {
        const guestCart = getGuestCart();
        let nextGuestCart = guestCart.filter((item) => item.id !== itemId);

        if (nextGuestCart.length === guestCart.length) {
          nextGuestCart = guestCart.filter(
            (item) =>
              !(
                item.productId === currentItem.productId &&
                item.colorId === currentItem.colorId &&
                item.sizeId === currentItem.sizeId
              )
          );
        }

        saveGuestCart(nextGuestCart);
        set({ items: formatGuestCart(nextGuestCart) });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } catch (e) {
        console.error("Error removing from guest cart:", e);
        await get().refreshCart();
      }
      return;
    }

    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      if (res.ok) {
        await get().refreshCart();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } else if (res.status === 401) {
        try {
          const guestCart = getGuestCart();
          let nextGuestCart = guestCart.filter((item) => item.id !== itemId);

          if (nextGuestCart.length === guestCart.length && currentItem) {
            nextGuestCart = guestCart.filter(
              (item) =>
                !(
                  item.productId === currentItem.productId &&
                  item.colorId === currentItem.colorId &&
                  item.sizeId === currentItem.sizeId
                )
            );
          }

          saveGuestCart(nextGuestCart);
          set({ items: formatGuestCart(nextGuestCart) });
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("cartUpdated"));
          }
        } catch (e) {
        }
      } else {
        await get().refreshCart();
      }
    } catch (error) {
      console.error("Error removing item:", error);
      await get().refreshCart();
    }
  },

  applyCoupon: async (code: string) => {
    if (get().couponCode) {
      return { success: false, message: "Zaten bir kupon uygulanmış. Önce mevcut olanı silmelisiniz." };
    }

    try {
      const res = await fetch("/api/coupons/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });

      const data = await res.json();

      if (data.valid) {

        const currentItems = get().items;

        const eligibleItems = currentItems.filter(item => {
          const catMatch = data.categoryId ? item.product.categoryId === data.categoryId : true;
          const genderMatch = data.gender ? item.product.gender === data.gender : true;
          return catMatch && genderMatch;
        });

        if (eligibleItems.length === 0) {
          set({ couponCode: null, discountAmount: 0 });
          return { success: false, message: "Kupon bu ürünler için geçerli değil" };
        }

        const eligibleSubtotal = eligibleItems.reduce((acc, item) =>
          acc + ((item.product.originalPrice ?? item.product.price) * item.quantity), 0
        );

        let discount = 0;
        if (data.discountType === "PERCENT") {
          discount = (eligibleSubtotal * data.value) / 100;
        } else {
          discount = data.value;
        }

        if (discount > eligibleSubtotal) discount = eligibleSubtotal;

        set({
          couponCode: data.code,
          discountAmount: discount
        });

        return { success: true, message: "Kupon uygulandı" };
      } else {
        set({ couponCode: null, discountAmount: 0 });
        return { success: false, message: data.message || "Geçersiz kupon kodu" };
      }
    } catch (error) {
      console.error("Coupon apply error:", error);
      return { success: false, message: "Kupon doğrulanırken bir hata oluştu" };
    }
  },

  removeCoupon: () => {
    set({ couponCode: null, discountAmount: 0 });
  },

  refreshCart: async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const items = await res.json();
        if (typeof window !== "undefined") {
          localStorage.removeItem("guestCart");
        }
        set({ items, isReady: true });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } else if (res.status === 401) {
        const guestCart = getGuestCart();
        if (guestCart.length > 0) {
          set({ items: formatGuestCart(guestCart), isReady: true });
        } else {
          set({ items: [], isReady: true });
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cartUpdated"));
        }
      }
    } catch (error) {
      console.error("Error refreshing cart:", error);
    }
  },

  syncGuestCartToAPI: async () => {
    const guestCart = getGuestCart();
    if (guestCart.length === 0) return;

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

    if (successCount > 0) {
      if (successCount === guestCart.length) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("guestCart");
        }
      } else {
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

      await get().refreshCart();
    }
  },
}));
