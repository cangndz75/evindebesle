import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://evindebesle.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/cart",
                    "/checkout",
                    "/payment",
                    "/account",
                    "/auth",
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/api",
                    "/verify/",
                    "/test/",
                    "/_next/",
                    "/admin-*",
                    "/*?*sort=",
                    "/*?*sortBy=",
                    "/*?*page=",
                    "/*?*minPrice=",
                    "/*?*maxPrice=",
                    "/*?*size=",
                    "/*?*color=",
                    "/*?*utm_*",
                    "/*?*fbclid=*",
                ],
            },
            {
                userAgent: "Googlebot",
                allow: "/",
                disallow: [
                    "/cart",
                    "/checkout",
                    "/payment",
                    "/account",
                    "/auth",
                    "/admin/",
                    "/dashboard/",
                    "/api/",
                    "/api",
                    "/*?*sort=",
                    "/*?*sortBy=",
                    "/*?*page=",
                    "/*?*minPrice=",
                    "/*?*maxPrice=",
                    "/*?*size=",
                    "/*?*color=",
                    "/*?*utm_*",
                    "/*?*fbclid=*",
                ],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    };
}
