import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CategoryProductsPage from "../../_components/CategoryProductsPage";
import { Metadata } from "next";

export const revalidate = 300;
export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
                price: { gt: 0 },
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

        const mapped = products.map((p: any) => ({
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
                id: s.id,
                name: s.name,
                stock: s.stock,
            })),
            sizeOptions: p.sizeOptions?.map((so: any) => ({
                id: so.id,
                name: so.name,
                isActive: so.isActive,
            })),
            tags: p.tags.map((t: any) => ({ name: t.name })),
        }));

        mapped.sort((a: any, b: any) => {
            const totalStockA = a.colors.reduce((sum: number, c: any) =>
                sum + (c.variants?.reduce((vs: number, v: any) => vs + (v.stock || 0), 0) || 0), 0);
            const totalStockB = b.colors.reduce((sum: number, c: any) =>
                sum + (c.variants?.reduce((vs: number, v: any) => vs + (v.stock || 0), 0) || 0), 0);
            const inStockA = totalStockA > 0 ? 1 : 0;
            const inStockB = totalStockB > 0 ? 1 : 0;
            return inStockB - inStockA;
        });

        return mapped;
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

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { slug } = await params;
    const query = (await searchParams) || {};
    const category = await getCategory(slug);

    if (!category) {
        return {
            title: "Kategori Bulunamadı",
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";
    const canonicalBase = `${baseUrl}/category/${slug}`;

    const queryKeys = Object.keys(query).filter((key) => {
        const value = query[key];
        if (Array.isArray(value)) return value.length > 0;
        return value != null && value !== "";
    });

    const isCleanCategoryPage = queryKeys.length === 0;
    const isSingleColorFacet =
        queryKeys.length === 1 &&
        queryKeys[0] === "color" &&
        (() => {
            const colorValue = query.color;
            if (Array.isArray(colorValue)) return colorValue.length === 1 && Boolean(colorValue[0]);
            return Boolean(colorValue);
        })();

    const allowIndex = isCleanCategoryPage || isSingleColorFacet;

    const canonical = isSingleColorFacet
        ? `${canonicalBase}?color=${encodeURIComponent(Array.isArray(query.color) ? query.color[0] : query.color as string)}`
        : canonicalBase;

    return {
        title: `${category.name} - Dark Velvet`,
        description: category.description || `${category.name} kategorisindeki ürünleri keşfedin.`,
        alternates: {
            canonical
        },
        robots: {
            index: allowIndex,
            follow: true,
        },
        openGraph: {
            type: "website",
            url: canonical,
            title: `${category.name} - Dark Velvet`,
            description: category.description || `${category.name} kategorisindeki ürünleri keşfedin.`,
            siteName: "Dark Velvet",
        },
    };
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;
    const category = await getCategory(slug);

    if (!category) {
        notFound();
    }

    const effectiveGenderFilter = category.gender && category.gender !== "UNISEX"
        ? category.gender
        : undefined;

    const [initialProducts, priceRange] = await Promise.all([
        getInitialProducts(slug, effectiveGenderFilter),
        getPriceRange(slug, effectiveGenderFilter),
    ]);

    return (
        <CategoryProductsPage
            categoryName={category.name}
            categorySlug={slug}
            gender={effectiveGenderFilter}
            initialProducts={initialProducts}
            initialPriceRange={priceRange}
        />
    );
}
