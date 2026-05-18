import Iyzipay from "iyzipay";

export const iyzico = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY!,
    secretKey: process.env.IYZICO_SECRET_KEY!,
    uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
});

export function iyzicoCall<T>(fn: (req: any, cb: (err: any, res: T) => void) => void, req: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        fn.call(iyzico, req, (err: any, res: T) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
}

/**
 * Ödeme `rawResult` içinden Iyzico kalem transaction listesini çıkarır.
 * Checkout'ta `basketItems[].id` olarak **productId** kullanıldığı için `itemId`
 * çoğu zaman OrderItem.id değil ürün id'sidir (iade eşlemesinde dikkat).
 */
export function extractIyzicoItemTransactions(rawResult: unknown): any[] {
    if (!rawResult || typeof rawResult !== "object") return [];
    const r = rawResult as Record<string, unknown>;
    const nested =
        r.payment && typeof r.payment === "object" ? (r.payment as Record<string, unknown>) : null;

    const candidates = [
        r.itemTransactions,
        r.paymentItems,
        r.itemtransactions,
        nested?.itemTransactions,
        nested?.paymentItems,
    ];

    for (const c of candidates) {
        if (Array.isArray(c) && c.length > 0) return c as any[];
    }
    return [];
}
