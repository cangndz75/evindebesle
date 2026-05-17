import { getSession } from "next-auth/react";
import { create } from "zustand";

type FavoritesState = {
    favoriteIds: Set<string>;
    isHydrated: boolean;
    hydrate: () => Promise<void>;
    isFavorite: (productId: string) => boolean;
    addFavorite: (productId: string) => Promise<boolean>;
    removeFavorite: (productId: string) => Promise<boolean>;
    toggleFavorite: (productId: string) => Promise<boolean>;
};

let _favInflight: Promise<void> | null = null;

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
    favoriteIds: new Set<string>(),
    isHydrated: false,

    hydrate: async () => {
        if (get().isHydrated) return;
        if (_favInflight) return _favInflight;

        _favInflight = (async () => {
            try {
                const session = await getSession();
                if (!session?.user) {
                    set({ favoriteIds: new Set<string>(), isHydrated: true });
                    return;
                }

                const res = await fetch("/api/favorites");
                if (res.ok) {
                    const favorites = await res.json();
                    const ids = new Set<string>(
                        Array.isArray(favorites)
                            ? favorites.map((f: any) => f.product?.id || f.productId).filter(Boolean)
                            : []
                    );
                    set({ favoriteIds: ids, isHydrated: true });
                } else {
                    set({ isHydrated: true });
                }
            } catch {
                set({ isHydrated: true });
            } finally {
                _favInflight = null;
            }
        })();

        return _favInflight;
    },

    isFavorite: (productId: string) => get().favoriteIds.has(productId),

    addFavorite: async (productId: string) => {
        const prev = new Set(get().favoriteIds);
        set({ favoriteIds: new Set([...prev, productId]) });

        try {
            const res = await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId }),
            });
            if (!res.ok) {
                set({ favoriteIds: prev });
                return false;
            }
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("favoriteUpdated"));
            }
            return true;
        } catch {
            set({ favoriteIds: prev });
            return false;
        }
    },

    removeFavorite: async (productId: string) => {
        const prev = new Set(get().favoriteIds);
        const next = new Set(prev);
        next.delete(productId);
        set({ favoriteIds: next });

        try {
            const res = await fetch(`/api/favorites?productId=${productId}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                set({ favoriteIds: prev });
                return false;
            }
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("favoriteUpdated"));
            }
            return true;
        } catch {
            set({ favoriteIds: prev });
            return false;
        }
    },

    toggleFavorite: async (productId: string) => {
        if (get().favoriteIds.has(productId)) {
            return get().removeFavorite(productId);
        }
        return get().addFavorite(productId);
    },
}));
