import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

/**
 * Dynamic Sitemap Generator (Next.js 13+ standard)
 * 
 * Automatically generates sitemap.xml by fetching routes, 
 * products, categories, and blog posts from the database.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

    // 1) Base Routes
    const staticRoutes = [
        { path: "", priority: 1.0, changeFrequency: "daily" as const },
        { path: "/home", priority: 1.0, changeFrequency: "daily" as const },
        { path: "/women", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/men", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
        { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
        { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
        { path: "/checkout", priority: 0.3, changeFrequency: "monthly" as const },
    ].map((route) => ({
        url: `${BASE_URL}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    try {
        // 2) Dynamic Categories
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
            take: 100, // Limit for build stability
        });
        const categoryRoutes = categories.map((cat: any) => ({
            url: `${BASE_URL}/category/${cat.slug}`,
            lastModified: cat.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));

        // 3) Dynamic Products with Images
        const products = await prisma.product.findMany({
            where: { isActive: true },
            select: {
                slug: true,
                id: true,
                updatedAt: true,
                primaryImage: true,
                secondaryImage: true,
                orderItems: {
                    select: { id: true },
                    take: 1
                }
            },
            take: 500, // Safe limit for free tier compute quota
        });

        const productRoutes = products.map((prod: any) => {
            const hasSales = prod.orderItems && prod.orderItems.length > 0;
            return {
                url: `${BASE_URL}/product/${prod.slug || prod.id}`,
                lastModified: prod.updatedAt,
                changeFrequency: "daily" as const,
                priority: hasSales ? 1.0 : 0.9,
            };
        });

        // 4) Dynamic Blog Posts
        const posts = await prisma.blogPost.findMany({
            where: { isPublished: true },
            select: { slug: true, updatedAt: true },
            take: 50,
        });
        const blogRoutes = posts.map((post: any) => ({
            url: `${BASE_URL}/blog/${post.slug}`,
            lastModified: post.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.6,
        }));

        return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
    } catch (error) {
        console.error("Sitemap generation database error (likely quota exceeded):", error);
        // Fallback to static routes so the build doesn't fail
        return staticRoutes;
    }
}
