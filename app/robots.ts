import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://evindebesle.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/payment/",
                    "/verify/",
                    "/test/",
                    "/_next/",
                    "/admin-*",
                ],
            },
            {
                userAgent: "Googlebot",
                allow: "/",
                disallow: ["/admin/", "/dashboard/", "/api/", "/payment/"],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    };
}
