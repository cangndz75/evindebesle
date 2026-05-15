import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { applyLayeredApiRateLimit } from "@/lib/middleware-api-rate-limit";

const MW_ADMIN_ABSOLUTE_MAX = 60 * 60 * 24 * 7; // 7 gün
const MW_ADMIN_ACCESS_MAX = 60 * 60;             // 1 saat

const ADMIN_PAGE_PREFIXES = [
  "/admin",
  "/dashboard",
  "/users",
  "/abandoned-carts",
  "/coupons",
  "/campaigns",
  "/email-campaigns",
  "/company-settings",
  "/analytics",
  "/automations",
  "/docs",
];

function isAdminPagePath(pathname: string): boolean {
  return ADMIN_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

function applyNoStoreHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");

  try {
    const isProtectedAdminApiPath =
      pathname.startsWith("/api/admin/") ||
      pathname.startsWith("/api/admin-");
    const isProtectedAdminPath = isAdminPagePath(pathname);

    if (isProtectedAdminPath || isProtectedAdminApiPath) {
      let token: Awaited<ReturnType<typeof getToken>> | null = null;
      try {
        token = await getToken({ req: request });
      } catch (error) {
        console.error("[middleware] getToken error", {
          pathname,
          method: request.method,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      if (!token || !token.isAdmin) {
        if (isProtectedAdminApiPath) {
          return applyNoStoreHeaders(
            NextResponse.json({ error: "Forbidden" }, { status: 403 })
          );
        }
        return applyNoStoreHeaders(
          NextResponse.rewrite(new URL("/not-found", request.url), { status: 404 })
        );
      }

      if (token.isAdmin && token.adminLoginAt) {
        const nowSec = Math.floor(Date.now() / 1000);
        const sinceLogin = nowSec - (token.adminLoginAt as number);
        const sinceActive = nowSec - ((token.adminLastActiveAt as number) || 0);

        if (sinceLogin > MW_ADMIN_ABSOLUTE_MAX || sinceActive > MW_ADMIN_ACCESS_MAX) {
          if (isProtectedAdminApiPath) {
            return applyNoStoreHeaders(
              NextResponse.json(
                { error: "Admin session expired", code: "ADMIN_SESSION_EXPIRED" },
                { status: 401 }
              )
            );
          }
          const loginUrl = new URL("/auth-tabs", request.url);
          loginUrl.searchParams.set("reason", "session_expired");
          loginUrl.searchParams.set("callbackUrl", pathname);
          return applyNoStoreHeaders(NextResponse.redirect(loginUrl));
        }
      }

      const isMfaVerifyPath = pathname === "/mfa-verify" || pathname.startsWith("/mfa-verify/");
      const isMfaVerifyApi = pathname.startsWith("/api/admin/mfa/verify-login");
      if (token.mfaPending && !isMfaVerifyPath && !isMfaVerifyApi) {
        if (isProtectedAdminApiPath) {
          return applyNoStoreHeaders(
            NextResponse.json(
              { error: "MFA verification required", code: "MFA_PENDING" },
              { status: 403 }
            )
          );
        }
        return applyNoStoreHeaders(
          NextResponse.redirect(new URL("/mfa-verify", request.url))
        );
      }
    }

    if (isApiRoute) {
      const rateLimited = await applyLayeredApiRateLimit(request);
      if (rateLimited) {
        return applyNoStoreHeaders(rateLimited);
      }
    }

    const response = NextResponse.next();
    if (isApiRoute) {
      applyNoStoreHeaders(response);
    }
    return response;
  } catch (error) {
    console.error("[middleware] unhandled error", {
      pathname,
      method: request.method,
      error: error instanceof Error ? error.message : String(error),
    });

    if (isApiRoute) {
      return applyNoStoreHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    return applyNoStoreHeaders(
      NextResponse.rewrite(new URL("/not-found", request.url), { status: 404 })
    );
  }
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/admin-:path*",
    "/dashboard/:path*",
    "/users/:path*",
    "/abandoned-carts/:path*",
    "/coupons/:path*",
    "/campaigns/:path*",
    "/email-campaigns/:path*",
    "/company-settings/:path*",
    "/analytics/:path*",
    "/automations/:path*",
    "/docs/:path*",
  ],
};
