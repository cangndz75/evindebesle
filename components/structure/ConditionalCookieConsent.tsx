"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const CookieConsent = dynamic(() => import("@/components/CookieConsent"), {
  ssr: false,
});

export default function ConditionalCookieConsent() {
  const pathname = usePathname();

  const isAdminRoute =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/campaigns") ||
    pathname?.startsWith("/coupons") ||
    pathname?.startsWith("/email-campaigns") ||
    pathname?.startsWith("/company-settings") ||
    pathname?.startsWith("/users") ||
    pathname?.startsWith("/analytics") ||
    pathname?.startsWith("/automations") ||
    pathname?.startsWith("/abandoned-carts") ||
    pathname?.startsWith("/docs") ||
    pathname?.startsWith("/checkout");

  if (isAdminRoute) {
    return null;
  }

  return <CookieConsent />;
}
