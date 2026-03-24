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

// ISR - 5 dakikada bir yenilenir
export const revalidate = 300;
export const dynamic = "force-dynamic";

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
      const colorImages = parseImages(p.colors[0]?.images);
      const primaryImg = p.primaryImage || p.image;
      const secondaryImg = p.secondaryImage || p.image;

      // Yeni ürün mü kontrol et (tag'lere göre)
      const isNew = p.tags.some((tag: any) =>
        ["yeni ürün", "yeni", "yeni gelenler", "new", "new arrival"].includes(tag.name.toLowerCase())
      );

      return {
        id: p.id,
        name: p.name,
        slug: p.slug ?? undefined,
        price: p.price,
        originalPrice: p.originalPrice ?? undefined,
        image: primaryImg ?? undefined,
        hoverImage: secondaryImg ?? undefined,
        badge: isNew ? "Yeni" : (p.originalPrice && p.originalPrice > p.price ? "İndirim" : undefined),
        colors: p.colors.map((c: any) => {
          const cImages = parseImages(c.images);
          return {
            name: c.name,
            value: c.hexCode || "#000000",
            image: cImages[0] || primaryImg || "/placeholder.png",
          };
        }),
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

export default async function WomenPage() {
  // Paralel olarak tüm verileri çek
  const [initialProducts, priceRange, categories] = await Promise.all([
    getInitialProducts(),
    getPriceRange(),
    getCategories()
  ]);

  // Format products for schema
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
      />
    </>
  );
}
