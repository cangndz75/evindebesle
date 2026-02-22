import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CategoryProductsPage from "../../_components/CategoryProductsPage";
import { Metadata } from "next";

export const revalidate = 300;

type Props = {
    params: Promise<{ slug: string }>;
};

// Helper: JSON string'i array'e çevir
function parseImages(images: string | null): string[] {
    if (!images) return [];
    try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function getCategory(slug: string) {
    return await prisma.category.findUnique({
        where: { slug },
    });
}

async function getInitialProducts(categorySlug: string, gender?: any) {
    try {
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                category: { slug: categorySlug },
                gender: gender || undefined,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                image: true,
                primaryImage: true,
                secondaryImage: true,
                gender: true,
                fabricType: true,
                colors: {
                    select: {
                        id: true,
                        name: true,
                        hexCode: true,
                        images: true,
                        variants: {
                            select: {
                                id: true,
                                variantCode: true,
                                colorId: true,
                                sizeId: true,
                                stock: true,
                                price: true,
                            },
                        },
                    },
                },
                sizes: {
                    select: {
                        id: true,
                        name: true,
                        stock: true,
                    },
                },
                sizeOptions: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                    },
                },
                tags: {
                    select: {
                        name: true,
                    },
                },
                reviews: {
                    where: { isApproved: true },
                    select: { rating: true },
                    take: 5,
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return products.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug ?? undefined,
            price: p.price,
            image: p.image ?? undefined,
            primaryImage: p.primaryImage ?? undefined,
            secondaryImage: p.secondaryImage ?? undefined,
            gender: p.gender ?? undefined,
            fabricType: p.fabricType ?? undefined,
            colors: p.colors.map((c: any) => ({
                id: c.id,
                name: c.name,
                hexCode: c.hexCode ?? undefined,
                images: parseImages(c.images),
                variant: c.variants?.[0] ? {
                    id: c.variants[0].id,
                    variantCode: c.variants[0].variantCode,
                    colorId: c.variants[0].colorId,
                } : undefined,
                variants: c.variants,
            })),
            sizes: p.sizes.map((s: any) => ({
                name: s.name,
                stock: s.stock,
            })),
            sizeOptions: p.sizeOptions?.map((so: any) => ({
                name: so.name,
                isActive: so.isActive,
            })),
            tags: p.tags.map((t: any) => ({ name: t.name })),
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

async function getPriceRange(categorySlug: string, gender?: any) {
    try {
        const result = await prisma.product.aggregate({
            where: {
                isActive: true,
                category: { slug: categorySlug },
                gender: gender || undefined,
            },
            _min: { price: true },
            _max: { price: true },
        });
        return {
            min: result._min.price || 0,
            max: result._max.price || 2000,
        };
    } catch (error) {
        console.error("Error fetching price range:", error);
        return { min: 0, max: 2000 };
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const category = await getCategory(slug);

    if (!category) {
        return {
            title: "Kategori Bulunamadı",
        };
    }

    return {
        title: `${category.name} - Dark Velvet`,
        description: category.description || `${category.name} kategorisindeki ürünleri keşfedin.`,
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com"}/category/${slug}`
        }
    };
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;
    const category = await getCategory(slug);

    if (!category) {
        notFound();
    }

    const [initialProducts, priceRange] = await Promise.all([
        getInitialProducts(slug, category.gender || undefined),
        getPriceRange(slug, category.gender || undefined),
    ]);

    return (
        <CategoryProductsPage
            categoryName={category.name}
            categorySlug={slug}
            gender={category.gender || undefined}
            initialProducts={initialProducts}
            initialPriceRange={priceRange}
        />
    );
}
