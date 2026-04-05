import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit, getClientIdentifier, RateLimits } from "@/lib/rateLimit";

function applyNoStoreHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");

  const adminPaths = ["/admin", "/dashboard", "/users"];
  const isProtectedAdminApiPath =
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/admin-");
  const isSensitiveAuthApiPath = [
    "/api/register",
    "/api/forgot-password",
    "/api/reset-password",
    "/api/send-otp",
    "/api/verify-otp",
    "/api/checkout/initialize",
    "/api/payment/auth",
  ].some((path) => pathname.startsWith(path));

  const isProtectedAdminPath = adminPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedAdminPath || isProtectedAdminApiPath) {
    const token = await getToken({ req: request });
    if (!token || !token.isAdmin) {
      if (isProtectedAdminApiPath) {
        return applyNoStoreHeaders(
          NextResponse.json({ error: "Forbidden" }, { status: 403 })
        );
      }
      return applyNoStoreHeaders(
        NextResponse.redirect(new URL("/", request.url))
      );
    }
  }

  if (isSensitiveAuthApiPath) {
    const ip = getClientIdentifier(request);
    const rateKey = `sensitive:${pathname}:${ip}`;
    const profile = pathname.includes("checkout") || pathname.includes("payment")
      ? RateLimits.payment
      : RateLimits.strict;
    const result = await checkRateLimit(rateKey, profile);

    if (!result.success) {
      return applyNoStoreHeaders(
        NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      );
    }
  }

  const response = NextResponse.next();
  if (isApiRoute) {
    applyNoStoreHeaders(response);
  }
  return response;
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/dashboard/:path*", "/users/:path*"],
};
