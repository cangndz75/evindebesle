import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

export const RateLimits = {
    standard: { maxRequests: 20, window: "10 s" },
    strict: { maxRequests: 10, window: "60 s" },
    payment: { maxRequests: 3, window: "60 s" },
    lenient: { maxRequests: 60, window: "60 s" },
    upload: { maxRequests: 10, window: "60 s" },
} as const;

type RateLimitConfig = typeof RateLimits[keyof typeof RateLimits];

export function getClientIdentifier(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
    return ip;
}

export async function checkRateLimit(identifier: string, limitConfig: RateLimitConfig) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.error("Rate limiting unavailable: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set.");
        return {
            success: false,
            limit: limitConfig.maxRequests,
            remaining: 0,
            resetTime: Date.now() + 10000,
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
        console.error("Rate limit error:", error);
        return {
            success: false,
            limit: limitConfig.maxRequests,
            remaining: 0,
            resetTime: Date.now(),
        };
    }
}

export async function rateLimit(identifier: string) {
    return checkRateLimit(identifier, RateLimits.standard);
}
