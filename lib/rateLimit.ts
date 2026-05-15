import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

/**
 * Upstash sliding window: { maxRequests, window }.
 * Katmanlar: auth (sıkı) → finans → public katalog → formlar (spam).
 */
export const RateLimits = {
    standard: { maxRequests: 20, window: "10 s" },
    /** Genel sıkı (eski davranış; route bazlı kullanım) */
    strict: { maxRequests: 10, window: "60 s" },
    /** Ödeme / checkout — dakikada birkaç deneme (carding azaltma) */
    payment: { maxRequests: 4, window: "60 s" },
    lenient: { maxRequests: 60, window: "60 s" },
    upload: { maxRequests: 10, window: "60 s" },

    /** Giriş + MFA doğrulama — credential stuffing */
    authCredentials: { maxRequests: 8, window: "60 s" },
    /** Şifre sıfırlama (forgot + reset birleşik) — saatlik */
    authPasswordResetHourly: { maxRequests: 3, window: "3600 s" },
    /** OTP gönder / doğrula — saatlik */
    authOtpHourly: { maxRequests: 3, window: "3600 s" },
    /** Kayıt — saatlik, fake hesap ordusu */
    authRegisterHourly: { maxRequests: 4, window: "3600 s" },

    /** Kupon kodu brute-force */
    couponVerify: { maxRequests: 5, window: "60 s" },

    /** Arama (ILIKE / ağır sorgu) */
    searchPublic: { maxRequests: 40, window: "60 s" },
    /** Ürün listesi, ana sayfa ürünleri, kategori/koleksiyon public */
    catalogPublic: { maxRequests: 120, window: "60 s" },

    /** Yorum, iletişim, destek talebi — spam */
    formSpam: { maxRequests: 2, window: "60 s" },
} as const;

type RateLimitConfig = typeof RateLimits[keyof typeof RateLimits];

export function getClientIdentifier(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
    return ip;
}

export async function checkRateLimit(identifier: string, limitConfig: RateLimitConfig) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn(
            "[rateLimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN tanımlı değil; hız sınırı uygulanmıyor. Üretimde brute-force koruması için Upstash değişkenlerini ekleyin."
        );
        return {
            success: true,
            limit: limitConfig.maxRequests,
            remaining: limitConfig.maxRequests,
            resetTime: Date.now() + 60_000,
        };
    }

    try {
        const specificLimiter = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(limitConfig ? limitConfig.maxRequests : 10, limitConfig ? limitConfig.window as any : "10 s"),
            analytics: true,
            prefix: "@upstash/ratelimit",
        });

        const result = await specificLimiter.limit(identifier);

        return {
            success: result.success,
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.reset,
        };
    } catch (error) {
        console.error("[rateLimit] Upstash hatası, istek güvenlik nedeniyle geçiriliyor (limit uygulanamadı):", error);
        return {
            success: true,
            limit: limitConfig.maxRequests,
            remaining: limitConfig.maxRequests,
            resetTime: Date.now() + 60_000,
        };
    }
}

export async function rateLimit(identifier: string) {
    return checkRateLimit(identifier, RateLimits.standard);
}
