// lib/get-ip.ts
import type { NextRequest } from "next/server";

/** Vercel/Proxy arkasında gerçek müşteri IP’sini elde eder. */
export function getClientIp(req: NextRequest): string {
  // En güvenilir: X-Forwarded-For (ilk değer gerçek istemci)
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const ip = xff.split(",")[0]?.trim();
    if (ip) return ip;
  }
  // Diğer olası başlıklar
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-vercel-forwarded-for") ||
    "127.0.0.1"
  );
}
