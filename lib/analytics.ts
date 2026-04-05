
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        fbq: (...args: any[]) => void;
    }
}

export const trackPageView = (url: string) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("config", process.env.NEXT_PUBLIC_GA4_ID, {
            page_path: url,
        });
    }
};

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
};

export const trackViewItem = (product: {
    id: string;
    name: string;
    price: number;
    category?: string;
}) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "view_item", {
            currency: "TRY",
            value: product.price,
            items: [
                {
                    item_id: product.id,
                    item_name: product.name,
                    price: product.price,
                    item_category: product.category,
                },
            ],
        });
    }

    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "ViewContent", {
            content_ids: [product.id],
            content_name: product.name,
            content_type: "product",
            value: product.price,
            currency: "TRY",
        });
    }

    if (typeof window !== "undefined") {
        import('@/lib/analytics-tracker').then(({ trackProductView }) => {
            trackProductView(product);
        });
    }
};

export const trackAddToCart = (product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
}) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "add_to_cart", {
            currency: "TRY",
            value: product.price * product.quantity,
            items: [
                {
                    item_id: product.id,
                    item_name: product.name,
                    price: product.price,
                    quantity: product.quantity,
                    item_category: product.category,
                },
            ],
        });
    }

    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "AddToCart", {
            content_ids: [product.id],
            content_name: product.name,
            content_type: "product",
            value: product.price * product.quantity,
            currency: "TRY",
        });
    }

    if (typeof window !== "undefined") {
        import('@/lib/analytics-tracker').then(({ trackAddToCartEvent }) => {
            trackAddToCartEvent(product);
        });
    }
};

export const trackBeginCheckout = (items: Array<{ id: string; name: string; price: number; quantity: number }>, total: number) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "begin_checkout", {
            currency: "TRY",
            value: total,
            items: items.map((item) => ({
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                quantity: item.quantity,
            })),
        });
    }

    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "InitiateCheckout", {
            content_ids: items.map((i) => i.id),
            content_type: "product",
            value: total,
            currency: "TRY",
            num_items: items.length,
        });
    }
};

export const trackPurchase = (order: {
    orderId: string;
    total: number;
    items: Array<{ id: string; name: string; price: number; quantity: number }>;
}) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "purchase", {
            transaction_id: order.orderId,
            currency: "TRY",
            value: order.total,
            items: order.items.map((item) => ({
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                quantity: item.quantity,
            })),
        });
    }

    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Purchase", {
            content_ids: order.items.map((i) => i.id),
            content_type: "product",
            value: order.total,
            currency: "TRY",
            num_items: order.items.length,
        });
    }
};

export const trackSearch = (searchTerm: string) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "search", {
            search_term: searchTerm,
        });
    }

    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Search", {
            search_string: searchTerm,
        });
    }
};

export const trackSignUp = () => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "sign_up", {
            method: "email",
        });
    }

    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "CompleteRegistration");
    }
};

export const trackLogin = () => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "login", {
            method: "email",
        });
    }
};

export const trackAddToWishlist = (product: { id: string; name: string; price: number }) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "add_to_wishlist", {
            currency: "TRY",
            value: product.price,
            items: [
                {
                    item_id: product.id,
                    item_name: product.name,
                    price: product.price,
                },
            ],
        });
    }

    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "AddToWishlist", {
            content_ids: [product.id],
            content_name: product.name,
            value: product.price,
            currency: "TRY",
        });
    }
};
