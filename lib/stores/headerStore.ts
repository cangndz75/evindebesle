import { create } from "zustand";
import { getGuestCartCount } from "@/lib/cart-utils";
import { useCartStore } from "@/lib/stores/cartStore";
import { useCompanySettingsStore } from "@/lib/stores/companySettingsStore";
import { useFavoritesStore } from "@/lib/stores/favoritesStore";

type HeaderState = {
  cartCount: number;
  favoriteCount: number;
  freeShippingThreshold: number;
  isHydrated: boolean;
  setCartCount: (count: number) => void;
  setFavoriteCount: (count: number) => void;
  setFreeShippingThreshold: (threshold: number) => void;
  hydrate: (session: any) => Promise<void>;
  refreshCartCount: (session: any) => void;
  refreshFavoriteCount: (session: any) => Promise<void>;
};

let _headerInflight: Promise<void> | null = null;

export const useHeaderStore = create<HeaderState>((set, get) => ({
  cartCount: 0,
  favoriteCount: 0,
  freeShippingThreshold: 99,
  isHydrated: false,

  setCartCount: (count) => set({ cartCount: count }),
  setFavoriteCount: (count) => set({ favoriteCount: count }),
  setFreeShippingThreshold: (threshold) => set({ freeShippingThreshold: threshold }),

  hydrate: async (session) => {
    if (get().isHydrated) return;
    if (_headerInflight) return _headerInflight;

    _headerInflight = (async () => {
      try {
        if (!session?.user) {
          const guestCount = getGuestCartCount();
          set({ cartCount: guestCount, favoriteCount: 0, isHydrated: true });
          return;
        }

        const cartState = useCartStore.getState();
        const needsCartFetch = !cartState.hydrated;

        const fetches: Promise<any>[] = [
          needsCartFetch ? fetch("/api/cart") : Promise.resolve(null),
          useFavoritesStore.getState().hydrate(),
          useCompanySettingsStore.getState().hydrate(),
        ];

        const [cartRes] = await Promise.all(fetches);

        let cartCount = 0;
        if (cartRes && cartRes.ok) {
          const items = await cartRes.json();
          cartCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        } else if (!needsCartFetch) {
          cartCount = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
        }

        const favoriteCount = useFavoritesStore.getState().favoriteIds.size;
        const freeShippingThreshold = useCompanySettingsStore.getState().freeShippingThreshold;

        set({
          cartCount,
          favoriteCount,
          freeShippingThreshold,
          isHydrated: true,
        });
      } catch (error) {
        console.error("Error hydrating header:", error);
        set({ cartCount: 0, favoriteCount: 0, isHydrated: true });
      } finally {
        _headerInflight = null;
      }
    })();

    return _headerInflight;
  },

  refreshCartCount: (session) => {
    if (!session?.user) {
      const guestCount = getGuestCartCount();
      set({ cartCount: guestCount });
      return;
    }

    const cartState = useCartStore.getState();
    const total = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
    set({ cartCount: total });
  },

  refreshFavoriteCount: async (session) => {
    if (!session?.user) {
      set({ favoriteCount: 0 });
      return;
    }

    const favStore = useFavoritesStore.getState();
    if (favStore.isHydrated) {
      set({ favoriteCount: favStore.favoriteIds.size });
    } else {
      await favStore.hydrate();
      set({ favoriteCount: useFavoritesStore.getState().favoriteIds.size });
    }
  },
}));
