import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit, getClientIdentifier, RateLimits } from "@/lib/rateLimit";

type LimitConfig = (typeof RateLimits)[keyof typeof RateLimits];

function tooManyResponse(message: string, resetTime: number) {
  const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
  return NextResponse.json(
    { error: message, retryAfter },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
    }
  );
}

function rateLimitUnavailableResponse() {
  return NextResponse.json(
    {
      error:
        "Hız sınırı servisi şu an kullanılamıyor. Lütfen bir süre sonra tekrar deneyin veya destek ile iletişime geçin.",
      code: "RATE_LIMIT_SERVICE_UNAVAILABLE",
    },
    {
      status: 503,
      headers: {
        "Retry-After": "60",
      },
    }
  );
}

/**
 * /api/* için path + method bazlı Upstash rate limit.
 * Admin sayfa korumasından sonra, route handler’dan önce çalıştırılmalıdır.
 */
export async function applyLayeredApiRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  if (!pathname.startsWith("/api/")) return null;
  if (method === "OPTIONS" || method === "HEAD") return null;

  const ip = getClientIdentifier(request);

  const run = async (key: string, profile: LimitConfig, message: string) => {
    const result = await checkRateLimit(key, profile);
    if (!result.success) {
      if (result.unavailable) {
        return rateLimitUnavailableResponse();
      }
      return tooManyResponse(message, result.resetTime);
    }
    return null;
  };

  // 1 — Login (NextAuth credentials)
  if (pathname.startsWith("/api/auth/callback/credentials") && method === "POST") {
    return run(`rl:auth:credentials:${ip}`, RateLimits.authCredentials, "Çok fazla giriş denemesi. Lütfen bir dakika sonra tekrar deneyin.");
  }

  // 2 — Admin MFA doğrulama
  if (pathname.startsWith("/api/admin/mfa/verify-login") && method === "POST") {
    return run(`rl:auth:mfa-verify:${ip}`, RateLimits.authCredentials, "Çok fazla doğrulama denemesi. Lütfen bir dakika sonra tekrar deneyin.");
  }

  // 3 — Şifre sıfırlama (forgot + reset aynı kota)
  if (
    (pathname.startsWith("/api/forgot-password") || pathname.startsWith("/api/reset-password")) &&
    method === "POST"
  ) {
    return run(
      `rl:auth:pwd-reset:${ip}`,
      RateLimits.authPasswordResetHourly,
      "Çok fazla şifre sıfırlama isteği. Lütfen bir süre sonra tekrar deneyin."
    );
  }

  // 4 — OTP
  if (
    (pathname.startsWith("/api/send-otp") || pathname.startsWith("/api/verify-otp")) &&
    method === "POST"
  ) {
    return run(
      `rl:auth:otp:${ip}`,
      RateLimits.authOtpHourly,
      "Çok fazla doğrulama kodu isteği. Lütfen bir süre sonra tekrar deneyin."
    );
  }

  // 5 — Kayıt
  if (pathname.startsWith("/api/register") && method === "POST") {
    return run(
      `rl:auth:register:${ip}`,
      RateLimits.authRegisterHourly,
      "Çok fazla kayıt denemesi. Lütfen daha sonra tekrar deneyin."
    );
  }

  // 6 — Ödeme / checkout (checkout/initialize route ile aynı anahtar: çift sayım yok)
  if (
    (pathname.startsWith("/api/checkout/initialize") || pathname.startsWith("/api/payment/auth")) &&
    method === "POST"
  ) {
    return run(
      `checkout:${ip}`,
      RateLimits.payment,
      "Çok fazla ödeme denemesi. Lütfen bir dakika sonra tekrar deneyin."
    );
  }

  // 7 — Resend webhook (imza doğrulaması route içinde; abuse sınırı)
  if (pathname.startsWith("/api/webhooks/resend") && method === "POST") {
    return run(
      `rl:webhook:resend:${ip}`,
      RateLimits.strict,
      "Çok fazla webhook isteği. Lütfen kısa bir süre sonra tekrar deneyin."
    );
  }

  // 8 — Kupon doğrulama
  if (pathname.startsWith("/api/coupons/verify") && method === "POST") {
    return run(
      `rl:finance:coupon:${ip}`,
      RateLimits.couponVerify,
      "Çok fazla kupon denemesi. Lütfen kısa bir süre bekleyin."
    );
  }

  // 8 — Arama
  if (pathname.startsWith("/api/search") && method === "GET") {
    return run(
      `rl:public:search:${ip}`,
      RateLimits.searchPublic,
      "Çok fazla arama isteği. Lütfen kısa bir süre sonra tekrar deneyin."
    );
  }

  // 9 — Katalog (GET)
  if (method === "GET") {
    const catalogPrefixes = [
      "/api/products",
      "/api/home/products",
      "/api/categories/public",
      "/api/collections/public",
    ];
    if (catalogPrefixes.some((p) => pathname.startsWith(p))) {
      return run(
        `rl:public:catalog:${ip}`,
        RateLimits.catalogPublic,
        "Çok fazla istek. Lütfen kısa bir süre sonra tekrar deneyin."
      );
    }
  }

  // 10 — Genel dosya yükleme (admin / iade vb.; yorum: /api/upload/review route limiti)
  if (pathname.startsWith("/api/upload") && method === "POST") {
    let actor = `ip:${ip}`;
    try {
      const token = await getToken({ req: request });
      if (token?.sub) actor = `u:${token.sub}`;
    } catch {
      /* ignore */
    }
    return run(
      `rl:upload:${actor}`,
      RateLimits.upload,
      "Çok fazla yükleme isteği. Lütfen bir dakika sonra tekrar deneyin."
    );
  }

  // 11 — Form / spam (POST)
  if (method === "POST") {
    const formPrefixes = [
      "/api/product-reviews",
      "/api/contact",
      "/api/support",
      "/api/appointment-reviews",
      "/api/newsletter/subscribe",
    ];
    if (formPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      let actor = `ip:${ip}`;
      try {
        const token = await getToken({ req: request });
        if (token?.sub) actor = `u:${token.sub}`;
      } catch {
        /* ignore */
      }
      return run(
        `rl:form:${pathname}:${actor}`,
        RateLimits.formSpam,
        "Çok fazla gönderim. Lütfen bir dakika bekleyin."
      );
    }
  }

  return null;
}
