"use client";

import { usePathname } from "next/navigation";
import FooterAccordion from "@/components/home/FooterAccordion";

export default function ConditionalFooter() {
    const pathname = usePathname();

    const adminRoutes = [
        "/dashboard",
        "/admin",
        "/campaigns",
        "/coupons",
        "/email-campaigns",
        "/company-settings",
        "/users",
        "/analytics",
        "/automations",
        "/coupons",
        "/checkout",
    ];

    const isAdminRoute = adminRoutes.some((route) => pathname?.startsWith(route));

    if (isAdminRoute) {
        return null;
    }

    return <FooterAccordion />;
}
