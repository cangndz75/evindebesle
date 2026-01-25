import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://evindebesle.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Statik sayfalar
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${BASE_URL}/home`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${BASE_URL}/women`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/men`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/services`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/distance-selling`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];

    // Ürünler
    let productPages: MetadataRoute.Sitemap = [];
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            select: {
                id: true,
                slug: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
        });

        productPages = products.map((product) => ({
            url: `${BASE_URL}/product/${product.slug || product.id}`,
            lastModified: product.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));
    } catch (error) {
        console.error("Error fetching products for sitemap:", error);
    }

    // Kategoriler
    let categoryPages: MetadataRoute.Sitemap = [];
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: {
                slug: true,
                updatedAt: true,
            },
        });

        categoryPages = categories.map((category) => ({
            url: `${BASE_URL}/category/${category.slug}`,
            lastModified: category.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));
    } catch (error) {
        console.error("Error fetching categories for sitemap:", error);
    }

    return [...staticPages, ...productPages, ...categoryPages];
}
