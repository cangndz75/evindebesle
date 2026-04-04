import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function applyNoStoreHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");

  const adminPaths = ["/admin","/dashboard", "/users"];

  const isProtectedAdminPath = adminPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedAdminPath) {
    if (!token || !token.isAdmin) {
      return applyNoStoreHeaders(NextResponse.redirect(new URL("/", request.url)));
    }
  }

  const response = NextResponse.next();
  if (isApiRoute) {
    applyNoStoreHeaders(response);
  }
  return response;
}
