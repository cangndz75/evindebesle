import { NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier, RateLimits } from "@/lib/rateLimit";

type RateLimitPreset = keyof typeof RateLimits;

/**
 * Rate limit middleware wrapper for API routes
 * @param handler The API route handler
 * @param preset Rate limit preset to use
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T extends Request>(
    handler: (req: T) => Promise<Response>,
    preset: RateLimitPreset = "standard"
) {
    return async (req: T): Promise<Response> => {
        const identifier = getClientIdentifier(req);
        const limit = RateLimits[preset];

        const result = checkRateLimit(identifier, limit);

        if (!result.success) {
            return NextResponse.json(
                {
                    error: "Too many requests",
                    retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
                        "X-RateLimit-Limit": String(limit.maxRequests),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": String(result.resetTime),
                    },
                }
            );
        }

        // Add rate limit headers to response
        const response = await handler(req);

        // Clone response to add headers
        const newResponse = new Response(response.body, response);
        newResponse.headers.set("X-RateLimit-Limit", String(limit.maxRequests));
        newResponse.headers.set("X-RateLimit-Remaining", String(result.remaining));
        newResponse.headers.set("X-RateLimit-Reset", String(result.resetTime));

        return newResponse;
    };
}

/**
 * Simple rate limit check for use in existing handlers
 * Returns NextResponse with 429 if rate limited, null otherwise
 */
export function rateLimitCheck(
    request: Request,
    preset: RateLimitPreset = "standard"
): NextResponse | null {
    const identifier = getClientIdentifier(request);
    const limit = RateLimits[preset];
    const result = checkRateLimit(identifier, limit);

    if (!result.success) {
        return NextResponse.json(
            {
                error: "Çok fazla istek gönderdiniz. Lütfen bekleyin.",
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
                },
            }
        );
    }

    return null;
}
