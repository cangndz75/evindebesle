import dynamic from "next/dynamic";
import { Suspense } from "react";
import AnnouncementBar from "@/components/home/AnnouncementBar";
import CampaignStrip from "@/components/home/CampaignStrip";
import ByltStyleHero from "@/components/home/ByltStyleHero";
import ProductShowcase from "@/components/home/ProductShowcase";

// Lazy load büyük componentler
const EditorialBanner = dynamic(() => import("@/components/home/EditorialBanner"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
});
const CollectionCarousel = dynamic(() => import("@/components/home/CollectionCarousel"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse" />,
});
const BrandShowcase = dynamic(() => import("@/components/home/BrandShowcase"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
});
const SplitShowcase = dynamic(() => import("@/components/home/SplitShowcase"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse" />,
});
const FeaturedCardsRow = dynamic(() => import("@/components/home/FeaturedCardsRow"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
});
const ProductCarousel = dynamic(() => import("@/components/home/ProductCarousel"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse" />,
});
const EditorialTiles = dynamic(() => import("@/components/home/EditorialTiles"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
});
const TabbedBestSellers = dynamic(() => import("@/components/home/TabbedBestSellers"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse" />,
});
const NewsletterSignup = dynamic(() => import("@/components/home/NewsletterSignup"), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
});
const FooterAccordion = dynamic(() => import("@/components/home/FooterAccordion"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
});
import { womensBrands, mensBrands } from "@/lib/homeData";
import type { Product } from "@/lib/homeData";
import TabbedProductCarousel from "@/components/home/TabbedProductCarousel";
import { prisma } from "@/lib/db";

// Performans için ISR - 5 dakikada bir yenilenir
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

// Helper: Product'ı formatla
function formatProduct(product: any, type: "new-arrivals" | "best-sellers" | "featured"): Product {
  const firstColor = product.colors[0];
  const colorImages = firstColor?.images ? parseImages(firstColor.images) : [];
  const mainImage = product.primaryImage || product.image || colorImages[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";
  const hoverImage = product.secondaryImage || colorImages[1] || mainImage;

  if (type === "featured") {
    return {
      id: product.id,
      title: product.name,
      price: product.price,
      image: mainImage,
      hoverImage: hoverImage !== mainImage ? hoverImage : undefined,
      colors: product.colors.map((c: any) => {
        const images = parseImages(c.images);
        return {
          name: c.name || "",
          value: c.hexCode || "#000000",
          image: images[0] || mainImage,
        };
      }),
      sizes: product.sizes?.map((s: { name: string; stock: number; id: string }) => ({ name: s.name, stock: s.stock, id: s.id })) || [],
      sizeOptions: product.sizeOptions?.map((so: { name: string; id: string }) => ({ name: so.name, id: so.id })) || [],
      colorId: product.colors[0]?.id,
      variants: product.colors[0]?.variants?.map((v: { colorId: string | null; sizeId: string | null; stock: number }) => ({
        colorId: v.colorId,
        sizeId: v.sizeId,
        stock: v.stock,
      })) || [],
    };
  }

  return {
    id: product.id,
    title: product.name,
    price: product.price,
    originalPrice: product.originalPrice || undefined,
    image: mainImage,
    hoverImage: hoverImage !== mainImage ? hoverImage : undefined,
    badge: product.originalPrice ? "İndirim" : "Yeni",
    colors: product.colors.map((c: any) => {
      const images = parseImages(c.images);
      return images[0] || "";
    }).filter(Boolean),
    sizes: product.sizes?.map((s: any) => ({ name: s.name, stock: s.stock, id: s.id })) || [],
    sizeOptions: product.sizeOptions?.map((so: any) => ({ name: so.name, id: so.id })) || [],
    colorId: product.colors[0]?.id,
    variants: product.colors[0]?.variants?.map((v: any) => ({
      colorId: v.colorId,
      sizeId: v.sizeId,
      stock: v.stock,
    })) || [],
  };
}

async function getNewArrivals(gender?: "MALE" | "FEMALE"): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(gender && { gender: gender as "MALE" | "FEMALE" }),
        tags: {
          some: {
            name: {
              in: ["yeni ürün", "yeni", "yeni gelenler", "new", "new arrival"],
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        image: true,
        primaryImage: true,
        secondaryImage: true,
        colors: {
          take: 1,
          select: {
            id: true,
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    return products.map((p) => formatProduct(p, "new-arrivals"));
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    return [];
  }
}

async function getBestSellers(gender?: "MALE" | "FEMALE"): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(gender && { gender: gender as "MALE" | "FEMALE" }),
        OR: [
          {
            tags: {
              some: {
                name: {
                  in: ["çok satan", "best seller", "bestseller", "en çok satan"],
                },
              },
            },
          },
          {
            orderItems: {
              some: {},
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        image: true,
        primaryImage: true,
        secondaryImage: true,
        createdAt: true,
        colors: {
          take: 1,
          select: {
            id: true,
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
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    // Sipariş sayısına göre sırala
    products.sort((a, b) => {
      const aCount = a._count.orderItems;
      const bCount = b._count.orderItems;
      if (bCount !== aCount) {
        return bCount - aCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return products.map((p) => formatProduct(p, "best-sellers"));
  } catch (error) {
    console.error("Error fetching best sellers:", error);
    return [];
  }
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          {
            tags: {
              some: {
                name: {
                  in: ["öne çıkan", "featured", "trend", "popüler"],
                },
              },
            },
          },
          {
            orderItems: {
              some: {},
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        image: true,
        primaryImage: true,
        secondaryImage: true,
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
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    // Sipariş sayısına göre sırala
    products.sort((a, b) => {
      const aCount = a._count.orderItems;
      const bCount = b._count.orderItems;
      if (bCount !== aCount) {
        return bCount - aCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return products.map((p) => formatProduct(p, "featured"));
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}


export const metadata = {
  title: "Dark Velvet - Premium İç Çamaşırı",
  description:
    "Dark Velvet - Erkek ve kadın premium iç çamaşırı koleksiyonu. Zarif tasarımlar, konforlu kumaşlar ve modern stil.",
};

export default async function HomePage() {
  // Paralel olarak tüm verileri çek (performans için)
  const [newArrivals, newArrivalsWomen, newArrivalsMen, bestSellersWomen, bestSellersMen, featuredProducts] = await Promise.all([
    getNewArrivals(), // Tüm yeni gelenler
    getNewArrivals("FEMALE"), // Kadın yeni gelenler
    getNewArrivals("MALE"), // Erkek yeni gelenler
    getBestSellers("FEMALE"),
    getBestSellers("MALE"),
    getFeaturedProducts(), // Öne çıkan ürünler (ProductShowcase için)
  ]);

  return (
    <>
      <ByltStyleHero />
      <ProductShowcase products={featuredProducts} />
      <EditorialBanner />
      <BrandShowcase title="WOMENS BRANDS" items={womensBrands} />
      <BrandShowcase title="MEN'S BRANDS" items={mensBrands} />
      {/* <CollectionCarousel /> */}
      <TabbedProductCarousel 
        newArrivals={newArrivals}
        bestSellers={[...bestSellersWomen, ...bestSellersMen]}
        recommended={newArrivals}
      />
      <SplitShowcase />
      {/* <TwoUpEditorialTiles /> */}
      {/* <CategoryRail /> */}
      <FeaturedCardsRow />
      {/* <ProductCarousel title="Yeni Gelenler" products={newArrivals} viewAllLink="/women/new" /> */}
      <EditorialTiles />
      {/* <TabbedBestSellers 
        bestSellersWomen={bestSellersWomen}
        bestSellersMen={bestSellersMen}
      /> */}
      <NewsletterSignup />
      <FooterAccordion />
    </>
  );
}
