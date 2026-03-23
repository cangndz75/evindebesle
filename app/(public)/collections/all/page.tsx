import CollectionProductsPage from "@/app/(public)/_components/CollectionProductsPage";
import { prisma } from "@/lib/db";
import { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

export const metadata: Metadata = {
  title: "Tüm Koleksiyonlar | Dark Velvet",
  description: "Dark Velvet'in tüm özel koleksiyonlarını keşfedin. Her parça, kendine özgü bir hikaye anlatır.",
};

export const revalidate = 300;
export const dynamic = "force-dynamic";

function parseImages(images: string | null): string[] {
  if (!images) return [];
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images;
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
        collectionItems: {
          some: {
            collection: {
              isActive: true,
            },
          },
        },
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
          },
        },
        sizes: {
          select: {
            id: true,
            name: true,
            stock: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((p: any) => {
      const primaryImg = p.primaryImage || p.image;
      const secondaryImg = p.secondaryImage || p.image;

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
        collectionItems: {
          some: {
            collection: {
              isActive: true,
            },
          },
        },
      },
      _min: { price: true },
      _max: { price: true },
    });
    return {
      min: result._min.price || 0,
      max: result._max.price || 5000,
    };
  } catch (error) {
    return { min: 0, max: 5000 };
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
            collectionItems: {
              some: {
                collection: {
                  isActive: true,
                },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true }
    });
    return categories;
  } catch (error) {
    return [];
  }
}

export default async function CollectionsAllPage() {
  const [initialProducts, priceRange, categories] = await Promise.all([
    getInitialProducts(),
    getPriceRange(),
    getCategories()
  ]);

  return (
    <CollectionProductsPage
      initialProducts={initialProducts}
      initialPriceRange={priceRange}
      initialCategories={categories}
    />
  );
}
