import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  const pathname = request.nextUrl.pathname;

  const adminPaths = ["/admin","/dashboard", "/pets", "/services", "/users"];

  const isProtectedAdminPath = adminPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedAdminPath) {
    if (!token || !token.isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}
