import MenProductsPage from "../_components/MenProductsPageNew";
import { prisma } from "@/lib/db";
import { Metadata } from "next";
import CollectionPageSchema from "@/components/seo/CollectionPageSchema";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

export const metadata: Metadata = {
  title: "Erkek İç Giyim - Premium Boxer, İç Çamaşırı ve Sweat | Dark Velvet",
  description: "Dark Velvet erkek iç giyim koleksiyonu. Premium kalitede boxer, iç çamaşırı, sweat ve daha fazlası. Ücretsiz kargo ve hızlı teslimat ile tüm erkek ürünlerimizi keşfedin.",
  keywords: [
    "erkek iç çamaşırı",
    "erkek boxer",
    "erkek sweat",
    "erkek iç giyim",
    "premium iç çamaşırı",
    "erkek atlet",
    "erkek pijama",
    "online iç çamaşırı"
  ],
  openGraph: {
    title: "Erkek İç Giyim Koleksiyonu - Dark Velvet",
    description: "Premium kalitede erkek iç çamaşırı, boxer, sweat ve daha fazlası.",
    url: `${BASE_URL}/men`,
    type: "website",
    locale: "tr_TR",
    siteName: "Dark Velvet",
    images: [
      {
        url: `${BASE_URL}/og-men.jpg`,
        width: 1200,
        height: 630,
        alt: "Dark Velvet Erkek İç Giyim"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Erkek İç Giyim - Dark Velvet",
    description: "Premium erkek iç çamaşırı koleksiyonu"
  },
  alternates: {
    canonical: `${BASE_URL}/men`
  },
  robots: {
    index: true,
    follow: true
  }
};

// ISR - 5 dakikada bir yenilenir
export const revalidate = 300;

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

async function getInitialProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        gender: { in: ["MALE", "UNISEX"] },
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
      take: 100, // İlk yükleme için yeterli
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

async function getPriceRange() {
  try {
    const result = await prisma.product.aggregate({
      where: {
        isActive: true,
        gender: { in: ["MALE", "UNISEX"] },
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

export default async function MenPage() {
  // Paralel olarak tüm verileri çek
  const [initialProducts, priceRange] = await Promise.all([
    getInitialProducts(),
    getPriceRange(),
  ]);

  // Format products for schema
  const schemaProducts = initialProducts.slice(0, 12).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    image: p.image || p.primaryImage
  }));

  return (
    <>
      <CollectionPageSchema
        name="Erkek İç Giyim Koleksiyonu"
        description="Dark Velvet premium erkek iç çamaşırı, boxer, sweat ve daha fazlası"
        url={`${BASE_URL}/men`}
        products={schemaProducts}
        minPrice={priceRange.min}
        maxPrice={priceRange.max}
      />
      <MenProductsPage
        initialProducts={initialProducts}
        initialPriceRange={priceRange}
      />
    </>
  );
}
