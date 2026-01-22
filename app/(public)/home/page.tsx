import AnnouncementBar from "@/components/home/AnnouncementBar";
import CampaignStrip from "@/components/home/CampaignStrip";
import ByltStyleHero from "@/components/home/ByltStyleHero";
import ProductShowcase from "@/components/home/ProductShowcase";
import EditorialBanner from "@/components/home/EditorialBanner";
import CollectionCarousel from "@/components/home/CollectionCarousel";
import BrandShowcase from "@/components/home/BrandShowcase";
import SplitShowcase from "@/components/home/SplitShowcase";
import TwoUpEditorialTiles from "@/components/home/TwoUpEditorialTiles";
import CategoryRail from "@/components/home/CategoryRail";
import FeaturedCardsRow from "@/components/home/FeaturedCardsRow";
import ProductCarousel from "@/components/home/ProductCarousel";
import EditorialTiles from "@/components/home/EditorialTiles";
import TabbedBestSellers from "@/components/home/TabbedBestSellers";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import FooterAccordion from "@/components/home/FooterAccordion";
import { womensBrands, mensBrands } from "@/lib/homeData";
import { prisma } from "@/lib/db";
import type { Product } from "@/lib/homeData";

// Performans için ISR - 5 dakikada bir yenilenir
export const revalidate = 300;

async function getNewArrivals(gender?: "MALE" | "FEMALE"): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(gender && { gender }),
        tags: {
          some: {
            name: {
              in: ["yeni ürün", "yeni", "yeni gelenler", "new", "new arrival"],
            },
          },
        },
      },
      include: {
        colors: {
          take: 1,
          select: {
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    return products.map((product) => {
      const firstColor = product.colors[0];
      const colorImages = firstColor?.images || [];
      const mainImage = product.primaryImage || product.image || colorImages[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";
      const hoverImage = product.secondaryImage || colorImages[1] || mainImage;

      return {
        id: product.id,
        title: product.name,
        price: product.price,
        originalPrice: product.originalPrice || undefined,
        image: mainImage,
        hoverImage: hoverImage !== mainImage ? hoverImage : undefined,
        badge: product.originalPrice ? "İndirim" : "Yeni",
        colors: product.colors.map((c) => c.images[0] || "").filter(Boolean),
      };
    });
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
        ...(gender && { gender }),
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
      include: {
        colors: {
          take: 1,
          select: {
            images: true,
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

    return products.map((product) => {
      const firstColor = product.colors[0];
      const colorImages = firstColor?.images || [];
      const mainImage = product.primaryImage || product.image || colorImages[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";
      const hoverImage = product.secondaryImage || colorImages[1] || mainImage;

      return {
        id: product.id,
        title: product.name,
        price: product.price,
        originalPrice: product.originalPrice || undefined,
        image: mainImage,
        hoverImage: hoverImage !== mainImage ? hoverImage : undefined,
        badge: product.originalPrice ? "İndirim" : undefined,
        colors: product.colors.map((c) => c.images[0] || "").filter(Boolean),
      };
    });
  } catch (error) {
    console.error("Error fetching best sellers:", error);
    return [];
  }
}

async function getFeaturedProducts() {
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
            // En çok sipariş edilenler
            orderItems: {
              some: {},
            },
          },
        ],
      },
      include: {
        colors: {
          select: {
            name: true,
            hexCode: true,
            images: true,
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
      take: 4,
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

    return products.map((product) => {
      const firstColor = product.colors[0];
      const colorImages = firstColor?.images || [];
      const mainImage = product.primaryImage || product.image || colorImages[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";
      const hoverImage = product.secondaryImage || colorImages[1] || mainImage;

      return {
        id: product.id,
        title: product.name,
        price: product.price,
        image: mainImage,
        hoverImage: hoverImage !== mainImage ? hoverImage : undefined,
        colors: product.colors.map((c) => ({
          name: c.name,
          value: c.hexCode || "#000000",
          image: c.images[0] || mainImage,
        })),
      };
    });
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
      <CollectionCarousel />
      <SplitShowcase />
      {/* <TwoUpEditorialTiles /> */}
      {/* <CategoryRail /> */}
      <FeaturedCardsRow />
      <ProductCarousel title="Yeni Gelenler" products={newArrivals} viewAllLink="/women/new" />
      <EditorialTiles />
      <TabbedBestSellers 
        bestSellersWomen={bestSellersWomen}
        bestSellersMen={bestSellersMen}
      />
      <NewsletterSignup />
      <FooterAccordion />
    </>
  );
}
