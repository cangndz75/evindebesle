import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

function applyNoStoreHeaders(response: Response): Response {
  response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export function jsonNoStore(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  return applyNoStoreHeaders(response) as NextResponse;
}

export async function requireAdmin() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.isAdmin) {
    return {
      ok: false as const,
      response: jsonNoStore({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    session,
  };
}

export function withNoStore<T extends Response>(response: T): T {
  return applyNoStoreHeaders(response) as T;
}
