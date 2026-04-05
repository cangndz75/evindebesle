import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { buildProductPath } from "@/lib/seo/productPath";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";
const URLS_PER_SITEMAP = 50_000;

function getStaticRoutes(): MetadataRoute.Sitemap {
    return [
        { path: "", priority: 1.0, changeFrequency: "daily" as const },
        { path: "/home", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/women", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/men", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
        { path: "/collections", priority: 0.7, changeFrequency: "weekly" as const },
        { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
        { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
    ].map((route) => ({
        url: `${BASE_URL}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));
}

export async function generateSitemaps() {
    try {
        const productCount = await prisma.product.count({ where: { isActive: true } });
        const dynamicUrlCount = productCount;
        const totalDynamicSitemaps = Math.max(1, Math.ceil(dynamicUrlCount / URLS_PER_SITEMAP));

        return Array.from({ length: totalDynamicSitemaps }, (_, id) => ({ id }));
    } catch {
        return [{ id: 0 }];
    }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = getStaticRoutes();

    try {
        if (id === 0) {
            const [categories, posts, discoverSeeds] = await Promise.all([
                prisma.category.findMany({
                    where: { isActive: true },
                    select: { slug: true, updatedAt: true },
                }),
                prisma.blogPost.findMany({
                    where: { isPublished: true },
                    select: { slug: true, updatedAt: true },
                }),
                prisma.product.findMany({
                    where: {
                        isActive: true,
                        category: { isActive: true },
                        fabricType: { not: null },
                        colors: { some: {} },
                    },
                    select: {
                        updatedAt: true,
                        category: { select: { slug: true } },
                        fabricType: true,
                        colors: { select: { name: true }, take: 1 },
                    },
                    orderBy: { updatedAt: "desc" },
                    take: 220,
                }),
            ]);

            const toSlug = (value: string) =>
                value
                    .toLowerCase()
                    .replace(/ı/g, "i")
                    .replace(/İ/g, "i")
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9\s-]/g, "")
                    .trim()
                    .replace(/\s+/g, "-");

            const discoverMap = new Map<string, Date>();
            for (const item of discoverSeeds) {
                const categorySlug = item.category?.slug;
                const color = item.colors[0]?.name;
                const fabric = item.fabricType;
                if (!categorySlug || !color || !fabric) {
                    continue;
                }

                const colorSlug = toSlug(color);
                const fabricSlug = toSlug(fabric);
                if (!colorSlug || !fabricSlug) {
                    continue;
                }

                const key = `${colorSlug}-${fabricSlug}-${categorySlug}`;
                if (!discoverMap.has(key)) {
                    discoverMap.set(key, item.updatedAt);
                }
            }

            const categoryRoutes = categories.map((cat: { slug: string; updatedAt: Date }) => ({
                url: `${BASE_URL}/category/${cat.slug}`,
                lastModified: cat.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.8,
            }));

            const blogRoutes = posts.map((post: { slug: string; updatedAt: Date }) => ({
                url: `${BASE_URL}/blog/${post.slug}`,
                lastModified: post.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.6,
            }));

            const discoverRoutes = Array.from(discoverMap.entries()).slice(0, 180).map(([slugPath, updatedAt]) => ({
                url: `${BASE_URL}/${slugPath}`,
                lastModified: updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.7,
            }));

            const productChunk = await prisma.product.findMany({
                where: { isActive: true },
                select: {
                    slug: true,
                    id: true,
                    gender: true,
                    updatedAt: true,
                    category: {
                        select: { slug: true },
                    },
                    orderItems: { select: { id: true }, take: 1 },
                },
                orderBy: { updatedAt: "desc" },
                skip: 0,
                take: URLS_PER_SITEMAP,
            });

            const productRoutes = productChunk.map((prod: { slug: string | null; id: string; gender: string | null; updatedAt: Date; category: { slug: string } | null; orderItems: { id: string }[] }) => {
                const hasSales = prod.orderItems.length > 0;
                return {
                    url: `${BASE_URL}${buildProductPath({
                        id: prod.id,
                        slug: prod.slug,
                        gender: prod.gender,
                        categorySlug: prod.category?.slug,
                    })}`,
                    lastModified: prod.updatedAt,
                    changeFrequency: "daily" as const,
                    priority: hasSales ? 1.0 : 0.9,
                };
            });

            return [...staticRoutes, ...categoryRoutes, ...blogRoutes, ...discoverRoutes, ...productRoutes];
        }

        const offset = id * URLS_PER_SITEMAP;
        const productChunk = await prisma.product.findMany({
            where: { isActive: true },
            select: {
                slug: true,
                id: true,
                gender: true,
                updatedAt: true,
                category: {
                    select: { slug: true },
                },
                orderItems: { select: { id: true }, take: 1 },
            },
            orderBy: { updatedAt: "desc" },
            skip: offset,
            take: URLS_PER_SITEMAP,
        });

        return productChunk.map((prod: { slug: string | null; id: string; gender: string | null; updatedAt: Date; category: { slug: string } | null; orderItems: { id: string }[] }) => {
            const hasSales = prod.orderItems.length > 0;
            return {
                url: `${BASE_URL}${buildProductPath({
                    id: prod.id,
                    slug: prod.slug,
                    gender: prod.gender,
                    categorySlug: prod.category?.slug,
                })}`,
                lastModified: prod.updatedAt,
                changeFrequency: "daily" as const,
                priority: hasSales ? 1.0 : 0.9,
            };
        });
    } catch (error) {
        console.error("Sitemap generation failed:", error);
        return id === 0 ? staticRoutes : [];
    }
}
