import { create } from "zustand";

type CompanySettings = {
    freeShippingThreshold: number;
    shippingPrice: number;
    announcementMessages: string[];
};

type CompanySettingsState = CompanySettings & {
    isHydrated: boolean;
    _lastFetchedAt: number;
    hydrate: () => Promise<void>;
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 dakika
const DEFAULTS: CompanySettings = {
    freeShippingThreshold: 999,
    shippingPrice: 49.90,
    announcementMessages: [],
};

let _inflightPromise: Promise<void> | null = null;

export const useCompanySettingsStore = create<CompanySettingsState>((set, get) => ({
    ...DEFAULTS,
    isHydrated: false,
    _lastFetchedAt: 0,

    hydrate: async () => {
        const now = Date.now();
        if (get().isHydrated && now - get()._lastFetchedAt < CACHE_TTL_MS) return;

        if (_inflightPromise) return _inflightPromise;

        _inflightPromise = (async () => {
            try {
                const res = await fetch("/api/company-settings");
                if (!res.ok) {
                    set({ isHydrated: true, _lastFetchedAt: now });
                    return;
                }
                const data = await res.json();
                set({
                    freeShippingThreshold: Number(data.freeShippingThreshold) || DEFAULTS.freeShippingThreshold,
                    shippingPrice: Number(data.shippingPrice) || DEFAULTS.shippingPrice,
                    announcementMessages: Array.isArray(data.announcementMessages)
                        ? data.announcementMessages
                            .filter((m: unknown): m is string => typeof m === "string")
                            .map((m: string) => m.trim())
                            .filter(Boolean)
                        : [],
                    isHydrated: true,
                    _lastFetchedAt: now,
                });
            } catch {
                set({ isHydrated: true, _lastFetchedAt: now });
            } finally {
                _inflightPromise = null;
            }
        })();

        return _inflightPromise;
    },
}));
