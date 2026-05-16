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
} as const;

type RateLimitConfig = typeof RateLimits[keyof typeof RateLimits];

// HMR sırasında çoklu Redis bağlantılarını önlemek için global singleton
const globalForRedis = globalThis as unknown as {
    _upstashRedis: Redis | undefined;
};

function getRedis(): Redis {
    if (!globalForRedis._upstashRedis) {
        globalForRedis._upstashRedis = Redis.fromEnv();
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

export async function checkRateLimit(identifier: string, limitConfig: RateLimitConfig) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn(
            "[rateLimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN tanımlı değil; hız sınırı uygulanmıyor."
        );
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
        console.error("[rateLimit] Upstash hatası, istek güvenlik nedeniyle geçiriliyor:", error);
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
