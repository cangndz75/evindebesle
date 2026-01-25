type GA4Item = {
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
    item_variant?: string;
    item_brand?: string;
    item_category?: string;
    discount?: number;
    item_list_name?: string;
    item_list_id?: string;
    index?: number;
};

declare global {
    interface Window {
        dataLayer?: any[];
    }
}

export function dlPush(event: string, ecommerce: Record<string, any>) {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    // GA4 recommendation: clear ecommerce object first
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({ event, ecommerce });
}
