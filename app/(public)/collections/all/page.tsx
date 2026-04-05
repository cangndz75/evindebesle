import CollectionProductsPage from "@/app/(public)/_components/CollectionProductsPage";
import { prisma } from "@/lib/db";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { resolveSwatchHex } from "@/lib/color-swatch";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

export const metadata: Metadata = {
  title: "Tüm Koleksiyonlar | Dark Velvet",
  description: "Dark Velvet'in tüm özel koleksiyonlarını keşfedin. Her parça, kendine özgü bir hikaye anlatır.",
};

export const revalidate = 300;

function parseImages(images: string | null): string[] {
  if (!images) return [];
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const getInitialProducts = unstable_cache(
  async () => {
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
              value: resolveSwatchHex({ name: c.name, hexCode: c.hexCode }),
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
  },
  ["collections:all:initial-products"],
  { revalidate: 300, tags: ["products", "collections"] }
);

const getPriceRange = unstable_cache(
  async () => {
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
  },
  ["collections:all:price-range"],
  { revalidate: 300, tags: ["products"] }
);

const getCategories = unstable_cache(
  async () => {
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
  },
  ["collections:all:categories"],
  { revalidate: 300, tags: ["categories", "collections"] }
);

function CollectionsAllPageFallback() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12 pt-24">
        <div className="h-4 w-48 bg-[#111]/10 animate-pulse mb-6" />
        <div className="h-12 w-64 bg-[#111]/10 animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-3/4 bg-[#111]/10 animate-pulse" />
              <div className="h-4 w-3/4 bg-[#111]/10 animate-pulse" />
              <div className="h-4 w-1/3 bg-[#111]/10 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CollectionsAllPage() {
  const [initialProducts, priceRange, categories] = await Promise.all([
    getInitialProducts(),
    getPriceRange(),
    getCategories()
  ]);

  return (
    <Suspense fallback={<CollectionsAllPageFallback />}>
      <CollectionProductsPage
        initialProducts={initialProducts}
        initialPriceRange={priceRange}
        initialCategories={categories}
      />
    </Suspense>
  );
}
