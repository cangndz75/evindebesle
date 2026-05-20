import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

/**
 * Upstash sliding window: { maxRequests, window }.
 * Katmanlar: auth (sıkı) → finans → public katalog → formlar (spam).
 */
export const RateLimits = {
    standard: { maxRequests: 20, window: "10 s" },
    strict: { maxRequests: 10, window: "60 s" },
    payment: { maxRequests: 4, window: "60 s" },
    lenient: { maxRequests: 60, window: "60 s" },
    upload: { maxRequests: 10, window: "60 s" },

    authCredentials: { maxRequests: 8, window: "60 s" },
    authPasswordResetHourly: { maxRequests: 3, window: "3600 s" },
    authOtpHourly: { maxRequests: 3, window: "3600 s" },
    authRegisterHourly: { maxRequests: 4, window: "3600 s" },

    couponVerify: { maxRequests: 5, window: "60 s" },

    searchPublic: { maxRequests: 40, window: "60 s" },
    catalogPublic: { maxRequests: 120, window: "60 s" },

    formSpam: { maxRequests: 2, window: "60 s" },

    /** Puppeteer PDF fatura — kullanıcı başına (route içinde userId ile) */
    invoicePdf: { maxRequests: 5, window: "60 s" },

    /** Yorum görseli yükleme — kullanıcı başına */
    reviewUpload: { maxRequests: 10, window: "3600 s" },
} as const;

type RateLimitConfig = typeof RateLimits[keyof typeof RateLimits];

export type RateLimitCheckResult = {
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    /** Production'da Upstash yok veya Redis hatası; istek güvenli şekilde reddedilmeli */
    unavailable?: boolean;
};

/**
 * Edge / Lambda’da `Redis.fromEnv()` bazen env’i okuyamaz; ayrıca göreli yol (`/pipeline`)
 * hatası URL’nin boş veya geçersiz olduğunu gösterir. REST adresi mutlaka https://… olmalı.
 */
function readUpstashRestCredentials(): { url: string; token: string } | null {
    const rawUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!rawUrl || !token) return null;
    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== "https:") {
            console.error(
                "[rateLimit] UPSTASH_REDIS_REST_URL https ile başlamalı (Upstash REST URL’si, rediss:// değil):",
                rawUrl
            );
            return null;
        }
        if (!parsed.hostname) return null;
    } catch {
        console.error(
            "[rateLimit] UPSTASH_REDIS_REST_URL geçerli bir adres değil (tam REST URL: https://….upstash.io):",
            rawUrl
        );
        return null;
    }
    return { url: rawUrl, token };
}

function upstashEnvConfigured(): boolean {
    return readUpstashRestCredentials() !== null;
}

/** Acil durum: production'da bile Redis olmadan geç (varsayılan: kapalı) */
export function rateLimitAllowFailOpen(): boolean {
    return process.env.RATE_LIMIT_ALLOW_FAIL_OPEN === "true" || process.env.RATE_LIMIT_ALLOW_FAIL_OPEN === "1";
}

/** Üretimde Upstash yok/hata → istek reddedilir (fail-closed). */
export function isRateLimitFailClosed(): boolean {
    return process.env.NODE_ENV === "production" && !rateLimitAllowFailOpen();
}

// HMR sırasında çoklu Redis bağlantılarını önlemek için global singleton
const globalForRedis = globalThis as unknown as {
    _upstashRedis: Redis | undefined;
};

function getRedis(): Redis {
    const creds = readUpstashRestCredentials();
    if (!creds) {
        throw new Error("[rateLimit] Upstash REST url/token okunamadı (readUpstashRestCredentials null)");
    }
    if (!globalForRedis._upstashRedis) {
        globalForRedis._upstashRedis = new Redis(creds);
    }
    return globalForRedis._upstashRedis;
}

// Profil başına singleton limiter cache'i — her config için tek instance
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(limitConfig: RateLimitConfig): Ratelimit {
    const key = `${limitConfig.maxRequests}:${limitConfig.window}`;
    let limiter = limiterCache.get(key);
    if (!limiter) {
        limiter = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(limitConfig.maxRequests, limitConfig.window as any),
            analytics: true,
            prefix: "@upstash/ratelimit",
        });
        limiterCache.set(key, limiter);
    }
    return limiter;
}

export function getClientIdentifier(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
    return ip;
}

export async function checkRateLimit(
    identifier: string,
    limitConfig: RateLimitConfig
): Promise<RateLimitCheckResult> {
    const failClosedPayload: RateLimitCheckResult = {
        success: false,
        limit: 0,
        remaining: 0,
        resetTime: Date.now() + 60_000,
        unavailable: true,
    };

    if (!upstashEnvConfigured()) {
        const msg =
            "[rateLimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN eksik veya geçersiz (REST: https://….upstash.io + token). Edge/Lambda ortamında bu değişkenlerin runtime’da da tanımlı olduğundan emin olun.";
        if (process.env.NODE_ENV === "production" && !rateLimitAllowFailOpen()) {
            console.error(`${msg} Production: istekler reddediliyor (RATE_LIMIT_ALLOW_FAIL_OPEN=1 ile geçici gevşetme).`);
            return failClosedPayload;
        }
        console.warn(msg);
        return {
            success: true,
            limit: limitConfig.maxRequests,
            remaining: limitConfig.maxRequests,
            resetTime: Date.now() + 60_000,
        };
    }

    try {
        const result = await getLimiter(limitConfig).limit(identifier);

        return {
            success: result.success,
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.reset,
        };
    } catch (error) {
        console.error("[rateLimit] Upstash hatası:", error);
        if (process.env.NODE_ENV === "production" && !rateLimitAllowFailOpen()) {
            return failClosedPayload;
        }
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

export type RateLimitPreset = keyof typeof RateLimits;

/**
 * Abuse’a karşı IP yerine oturumlu kullanıcı kimliği ile limit (ör. fatura PDF).
 */
export async function checkUserRateLimit(
    userId: string,
    preset: RateLimitPreset = "standard"
): Promise<RateLimitCheckResult> {
    const limitConfig = RateLimits[preset];
    return checkRateLimit(`u:${userId}:${preset}`, limitConfig);
}

export function rateLimitDenyResponse(
    result: RateLimitCheckResult,
    limitConfig: RateLimitConfig,
    message = "Çok fazla istek. Lütfen daha sonra tekrar deneyin."
): Response | null {
    if (result.success) return null;

    if (result.unavailable) {
        return Response.json(
            {
                error: "Hız sınırı servisi geçici olarak kullanılamıyor.",
                code: "RATE_LIMIT_SERVICE_UNAVAILABLE",
            },
            { status: 503, headers: { "Retry-After": "60" } }
        );
    }

    const retryAfter = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000));
    return Response.json(
        { error: message, retryAfter },
        {
            status: 429,
            headers: {
                "Retry-After": String(retryAfter),
                "X-RateLimit-Limit": String(result.limit || limitConfig.maxRequests),
                "X-RateLimit-Remaining": String(result.remaining),
                "X-RateLimit-Reset": String(result.resetTime),
            },
        }
    );
}
