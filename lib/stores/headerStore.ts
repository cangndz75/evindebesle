import { create } from "zustand";
import { getGuestCartCount } from "@/lib/cart-utils";

type HeaderState = {
  cartCount: number;
  favoriteCount: number;
  freeShippingThreshold: number;
  isHydrated: boolean;
  setCartCount: (count: number) => void;
  setFavoriteCount: (count: number) => void;
  setFreeShippingThreshold: (threshold: number) => void;
  hydrate: (session: any) => Promise<void>;
  refreshCartCount: (session: any) => Promise<void>;
  refreshFavoriteCount: (session: any) => Promise<void>;
};

export const useHeaderStore = create<HeaderState>((set, get) => ({
  cartCount: 0,
  favoriteCount: 0,
  freeShippingThreshold: 99,
  isHydrated: false,

  setCartCount: (count) => set({ cartCount: count }),
  setFavoriteCount: (count) => set({ favoriteCount: count }),
  setFreeShippingThreshold: (threshold) => set({ freeShippingThreshold: threshold }),

  hydrate: async (session) => {
    // Guard: Zaten hydrate edildiyse tekrar etme
    if (get().isHydrated) return;

    // Önce localStorage'dan guest cart sayısını göster (anında)
    if (!session?.user) {
      const guestCount = getGuestCartCount();
      set({ cartCount: guestCount, favoriteCount: 0, isHydrated: true });
    } else {
      // Giriş yapmış kullanıcı için API'den yükle
      try {
        const [cartRes, favoritesRes, settingsRes] = await Promise.all([
          fetch("/api/cart"),
          fetch("/api/favorites"),
          fetch("/api/company-settings"),
        ]);

        let cartCount = 0;
        if (cartRes.ok) {
          const items = await cartRes.json();
          cartCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        }

        let favoriteCount = 0;
        if (favoritesRes.ok) {
          const favorites = await favoritesRes.json();
          favoriteCount = favorites.length || 0;
        }

        let freeShippingThreshold = 99;
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          freeShippingThreshold = data.freeShippingThreshold || 99;
        }

        set({
          cartCount,
          favoriteCount,
          freeShippingThreshold,
          isHydrated: true,
        });
      } catch (error) {
        console.error("Error hydrating header:", error);
        set({ isHydrated: true });
      }
    }
  },

  refreshCartCount: async (session) => {
    if (!session?.user) {
      const guestCount = getGuestCartCount();
      set({ cartCount: guestCount });
      return;
    }

    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const items = await res.json();
        const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        set({ cartCount: total });
      }
    } catch (error) {
      console.error("Error refreshing cart count:", error);
    }
  },

  refreshFavoriteCount: async (session) => {
    if (!session?.user) {
      set({ favoriteCount: 0 });
      return;
    }

    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const favorites = await res.json();
        set({ favoriteCount: favorites.length || 0 });
      }
    } catch (error) {
      console.error("Error refreshing favorite count:", error);
    }
  },
}));
