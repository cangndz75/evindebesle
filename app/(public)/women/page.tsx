import WomenProductsPage from "../_components/WomenProductsPage";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Kadın Ürünleri - Dark Velvet",
  description: "Dark Velvet kadın premium iç çamaşırı koleksiyonu. Tüm kadın ürünlerimizi keşfedin.",
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
        gender: {
          in: ["FEMALE", "UNISEX"],
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
        badge: isNew ? "Yeni" : (p.originalPrice ? "İndirim" : undefined),
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
