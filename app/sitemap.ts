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

    // 2) Dynamic Categories
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
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
    });

    const productRoutes = products.map((prod: any) => {
        const images: { loc: string }[] = [];
        if (prod.primaryImage) {
            images.push({ loc: prod.primaryImage });
        }
        if (prod.secondaryImage && prod.secondaryImage !== prod.primaryImage) {
            images.push({ loc: prod.secondaryImage });
        }

        // Higher priority for products with sales
        const hasSales = prod.orderItems && prod.orderItems.length > 0;

        return {
            url: `${BASE_URL}/product/${prod.slug || prod.id}`,
            lastModified: prod.updatedAt,
            changeFrequency: "daily" as const,
            priority: hasSales ? 1.0 : 0.9,
            // Note: Next.js sitemap doesn't support images directly in MetadataRoute.Sitemap
            // But we can add them in a custom sitemap.xml if needed
        };
    });

    // 4) Dynamic Blog Posts
    const posts = await prisma.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
    });
    const blogRoutes = posts.map((post: any) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
