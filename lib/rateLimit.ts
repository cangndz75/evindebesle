/**
 * Rate Limiter Utility
 * In-memory rate limiting for API routes
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
        if (entry.resetTime < now) {
            rateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitOptions {
    windowMs?: number; // Time window in milliseconds
    maxRequests?: number; // Max requests per window
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Check if a request is rate limited
 * @param identifier Unique identifier (IP, user ID, etc.)
 * @param options Rate limit options
 * @returns Rate limit result
 */
export function checkRateLimit(
    identifier: string,
    options: RateLimitOptions = {}
): RateLimitResult {
    const {
        windowMs = 60 * 1000, // 1 minute default
        maxRequests = 60 // 60 requests per minute default
    } = options;

    const now = Date.now();
    const key = identifier;

    let entry = rateLimitMap.get(key);

    // If no entry or expired, create new
    if (!entry || entry.resetTime < now) {
        entry = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimitMap.set(key, entry);

        return {
            success: true,
            remaining: maxRequests - 1,
            resetTime: entry.resetTime,
        };
    }

    // Increment count
    entry.count++;

    if (entry.count > maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetTime: entry.resetTime,
        };
    }

    return {
        success: true,
        remaining: maxRequests - entry.count,
        resetTime: entry.resetTime,
    };
}

/**
 * Get identifier from request
 */
export function getClientIdentifier(request: Request): string {
    // Try to get real IP from headers (for reverse proxy setups)
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp;
    }

    // Fallback to a generic identifier
    return "unknown";
}

/**
 * Preset rate limits for different use cases
 */
export const RateLimits = {
    // Strict: Login, password reset
    strict: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15 min

    // Auth: API authentication endpoints
    auth: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute

    // Standard: General API routes
    standard: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 per minute

    // Relaxed: Public read endpoints
    relaxed: { windowMs: 60 * 1000, maxRequests: 120 }, // 120 per minute

    // Upload: File upload endpoints
    upload: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
} as const;
