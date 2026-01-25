import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

/**
 * Dynamic Sitemap Generator (Next.js 13+ standard)
 * 
 * Automatically generates sitemap.xml by fetching routes, 
 * products, categories, and blog posts from the database.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://evindebesle.com";

    // 1) Base Routes
    const staticRoutes = [
        "",
        "/home",
        "/blog",
        "/about",
        "/contact",
        "/checkout",
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: route === "" ? 1.0 : 0.8,
    }));

    // 2) Dynamic Categories
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
    });
    const categoryRoutes = categories.map((cat) => ({
        url: `${BASE_URL}/category/${cat.slug}`,
        lastModified: cat.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 3) Dynamic Products
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, id: true, updatedAt: true },
    });
    const productRoutes = products.map((prod) => ({
        url: `${BASE_URL}/product/${prod.slug || prod.id}`,
        lastModified: prod.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.9,
    }));

    // 4) Dynamic Blog Posts
    const posts = await prisma.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
    });
    const blogRoutes = posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
