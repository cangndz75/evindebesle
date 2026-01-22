import MenProductsPage from "../_components/MenProductsPageNew";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Erkek Ürünleri - Dark Velvet",
  description: "Dark Velvet erkek premium iç çamaşırı koleksiyonu. Tüm erkek ürünlerimizi keşfedin.",
};

// ISR - 5 dakikada bir yenilenir
export const revalidate = 300;

async function getInitialProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        gender: "MALE",
      },
      include: {
        colors: {
          include: {
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
        sizes: true,
        sizeOptions: true,
        tags: true,
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // İlk yükleme için yeterli
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug ?? undefined,
      price: p.price,
      image: p.image ?? undefined,
      primaryImage: p.primaryImage ?? undefined,
      secondaryImage: p.secondaryImage ?? undefined,
      gender: p.gender ?? undefined,
      fabricType: p.fabricType ?? undefined,
      colors: p.colors.map((c) => ({
        id: c.id,
        name: c.name,
        hexCode: c.hexCode,
        images: c.images,
        variant: c.variants?.[0],
        variants: c.variants,
      })),
      sizes: p.sizes.map((s) => ({
        name: s.name,
        stock: s.stock,
      })),
      sizeOptions: p.sizeOptions?.map((so) => ({
        name: so.name,
        isActive: so.isActive,
      })),
      tags: p.tags.map((t) => ({ name: t.name })),
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
        gender: "MALE",
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

  return (
    <MenProductsPage
      initialProducts={initialProducts}
      initialPriceRange={priceRange}
    />
  );
}
