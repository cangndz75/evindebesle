import WomenProductsPage from "../_components/WomenProductsPage";
import { prisma } from "@/lib/db";
import { Metadata } from "next";
import CollectionPageSchema from "@/components/seo/CollectionPageSchema";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

export const metadata: Metadata = {
  title: "Kadın İç Giyim - Premium Külot, Sütyen ve İç Çamaşırı | Dark Velvet",
  description: "Dark Velvet kadın iç giyim koleksiyonu. Premium kalitede külot, sütyen, iç çamaşırı ve daha fazlası. Ücretsiz kargo ve hızlı teslimat ile tüm kadın ürünlerimizi keşfedin.",
  keywords: [
    "kadın iç çamaşırı",
    "kadın külot",
    "kadın sütyen",
    "kadın iç giyim",
    "premium iç çamaşırı",
    "kadın sweat",
    "kadın pijama",
    "online iç çamaşırı"
  ],
  openGraph: {
    title: "Kadın İç Giyim Koleksiyonu - Dark Velvet",
    description: "Premium kalitede kadın iç çamaşırı, külot, sütyen ve daha fazlası.",
    url: `${BASE_URL}/women`,
    type: "website",
    locale: "tr_TR",
    siteName: "Dark Velvet",
    images: [
      {
        url: `${BASE_URL}/og-women.jpg`,
        width: 1200,
        height: 630,
        alt: "Dark Velvet Kadın İç Giyim"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Kadın İç Giyim - Dark Velvet",
    description: "Premium kadın iç çamaşırı koleksiyonu"
  },
  alternates: {
    canonical: `${BASE_URL}/women`
  },
  robots: {
    index: true,
    follow: true
  }
};

export const revalidate = 300;
export const dynamic = "force-dynamic";

function parseImages(images: string | null): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getInitialProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        gender: {
          in: ["FEMALE", "UNISEX"],
        },
        price: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        originalPrice: true,
        image: true,
        primaryImage: true,
        secondaryImage: true,
        gender: true,
        fabricType: true,
        createdAt: true,
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
      take: 100, // İlk yükleme için yeterli
    });

    return products.map((p: any) => {
      const isNew = p.tags.some((tag: any) =>
        ["yeni ürün", "yeni", "yeni gelenler", "new", "new arrival"].includes(tag.name.toLowerCase())
      );

      return {
        id: p.id,
        name: p.name,
        slug: p.slug ?? undefined,
        price: p.price,
        originalPrice: p.originalPrice ?? undefined,
        image: p.image ?? undefined,
        primaryImage: p.primaryImage ?? undefined,
        secondaryImage: p.secondaryImage ?? undefined,
        gender: p.gender ?? undefined,
        fabricType: p.fabricType ?? undefined,
        badge: isNew ? "Yeni" : (p.originalPrice && p.originalPrice > p.price ? "İndirim" : undefined),
        colors: p.colors.map((c: any) => ({
          id: c.id,
          name: c.name,
          hexCode: c.hexCode ?? undefined,
          images: parseImages(c.images),
          variant: c.variants?.[0]
            ? {
              id: c.variants[0].id,
              variantCode: c.variants[0].variantCode,
              colorId: c.variants[0].colorId,
            }
            : undefined,
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
        inColors: p.colors.length,
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function getPriceRange() {
  try {
    const result = await prisma.product.aggregate({
      where: {
        isActive: true,
        gender: {
          in: ["FEMALE", "UNISEX"],
        },
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

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        products: {
          some: {
            isActive: true,
            gender: { in: ["FEMALE", "UNISEX"] }
          }
        }
      },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true }
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function WomenPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const categoryParam = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  const initialSelectedCategory = typeof categoryParam === "string" ? categoryParam : "All";

  const [initialProducts, priceRange, categories] = await Promise.all([
    getInitialProducts(),
    getPriceRange(),
    getCategories()
  ]);

  const schemaProducts = initialProducts.slice(0, 12).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    image: p.image
  }));

  return (
    <>
      <CollectionPageSchema
        name="Kadın İç Giyim Koleksiyonu"
        description="Dark Velvet premium kadın iç çamaşırı, külot, sütyen ve daha fazlası"
        url={`${BASE_URL}/women`}
        products={schemaProducts}
        minPrice={priceRange.min}
        maxPrice={priceRange.max}
      />
      <WomenProductsPage
        initialProducts={initialProducts}
        initialPriceRange={priceRange}
        initialCategories={categories}
        initialSelectedCategory={initialSelectedCategory}
      />
    </>
  );
}
