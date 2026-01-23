import WomenProductsPage from "../_components/WomenProductsPage";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Kadın Ürünleri - Dark Velvet",
  description: "Dark Velvet kadın premium iç çamaşırı koleksiyonu. Tüm kadın ürünlerimizi keşfedin.",
};

// ISR - 5 dakikada bir yenilenir
export const revalidate = 300;

async function getInitialProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        gender: "FEMALE",
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

    return products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.primaryImage ?? p.image ?? undefined,
      hoverImage: p.secondaryImage ?? undefined,
      colors: p.colors.map((c: any) => ({
        name: c.name,
        value: c.hexCode ?? `#${c.name.toLowerCase().replace(/\s+/g, '')}`,
        image: c.images?.[0] ?? p.primaryImage ?? p.image ?? "",
      })),
      inColors: p.colors.length,
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
        gender: "FEMALE",
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

export default async function WomenPage() {
  // Paralel olarak tüm verileri çek
  const [initialProducts, priceRange] = await Promise.all([
    getInitialProducts(),
    getPriceRange(),
  ]);

  return (
    <WomenProductsPage
      initialProducts={initialProducts}
      initialPriceRange={priceRange}
    />
  );
}
