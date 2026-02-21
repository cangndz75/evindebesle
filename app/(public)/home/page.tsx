import dynamic from "next/dynamic";
import { Suspense } from "react";
import CampaignStrip from "@/components/home/CampaignStrip";
import ByltStyleHero from "@/components/home/ByltStyleHero";
import ProductShowcase from "@/components/home/ProductShowcase";

import CategoryShowcase from "@/components/home/CategoryShowcase";
import HomeCategoryRail from "@/components/home/HomeCategoryRail";

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

  // Hover image için: önce secondaryImage, sonra ilk rengin 2. görseli, sonra diğer renklerin görselleri
  let hoverImage = product.secondaryImage;
  if (!hoverImage && colorImages.length > 1) {
    hoverImage = colorImages[1];
  }
  // Eğer hala yoksa, diğer renklerden ilk görseli al
  if (!hoverImage && product.colors && product.colors.length > 1) {
    for (let i = 1; i < product.colors.length; i++) {
      const otherColorImages = product.colors[i]?.images ? parseImages(product.colors[i].images) : [];
      if (otherColorImages.length > 0) {
        hoverImage = otherColorImages[0];
        break;
      }
    }
  }
  // Son çare olarak mainImage
  if (!hoverImage) {
    hoverImage = mainImage;
  }

  if (type === "featured") {
    return {
      id: product.id,
      title: product.name,
      slug: product.slug || undefined,
      price: product.price,
      originalPrice: product.originalPrice || undefined,
      image: mainImage,
      hoverImage: hoverImage !== mainImage ? hoverImage : undefined,
      badge: product.originalPrice ? "İndirim" : "Yeni",
      colors: product.colors.map((c: any) => {
        const images = parseImages(c.images);
        return {
          id: c.id,
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
    slug: product.slug || undefined,
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
        slug: true,
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

    return products.map((p: any) => formatProduct(p, "new-arrivals"));
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
        slug: true,
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
    products.sort((a: any, b: any) => {
      const aCount = a._count.orderItems;
      const bCount = b._count.orderItems;
      if (bCount !== aCount) {
        return bCount - aCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return products.map((p: any) => formatProduct(p, "best-sellers"));
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
        slug: true,
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
    products.sort((a: any, b: any) => {
      const aCount = a._count.orderItems;
      const bCount = b._count.orderItems;
      if (bCount !== aCount) {
        return bCount - aCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return products.map((p: any) => formatProduct(p, "featured"));
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

// Kategorileri getir
type CategoryForRail = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
};

async function getCategories(): Promise<CategoryForRail[]> {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

import { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://darkvelvet.com";

export const metadata: Metadata = {
  title: "Dark Velvet | Premium İç ve Dış Giyim Koleksiyonu",
  description: "Türkiye'nin önde gelen premium iç giyim markası. Kadın ve erkek için kaliteli iç çamaşırı, külot, sütyen, boxer, sweat koleksiyonları. Ücretsiz kargo, hızlı teslimat.",
  keywords: [
    "iç çamaşırı",
    "kadın iç çamaşırı",
    "erkek iç çamaşırı",
    "külot",
    "sütyen",
    "boxer",
    "sweat",
    "Dark Velvet",
    "premium iç giyim",
    "online iç çamaşırı",
    "iç giyim mağazası"
  ],
  openGraph: {
    title: "Dark Velvet - Premium İç Giyim",
    description: "Türkiye'nin önde gelen premium iç giyim markası. Kaliteli ve şık tasarımlar.",
    url: `${BASE_URL}/home`,
    type: "website",
    locale: "tr_TR",
    siteName: "Dark Velvet",
    images: [
      {
        url: `${BASE_URL}/og-home.jpg`,
        width: 1200,
        height: 630,
        alt: "Dark Velvet Premium İç Giyim"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Dark Velvet - Premium İç Giyim",
    description: "Türkiye'nin önde gelen premium iç giyim markası"
  },
  alternates: {
    canonical: `${BASE_URL}/home`
  }
};

export default async function HomePage() {
  // Paralel olarak tüm verileri çek (performans için)
  const [newArrivals, newArrivalsWomen, newArrivalsMen, bestSellersWomen, bestSellersMen, featuredProducts, categories] = await Promise.all([
    getNewArrivals(), // Tüm yeni gelenler
    getNewArrivals("FEMALE"), // Kadın yeni gelenler
    getNewArrivals("MALE"), // Erkek yeni gelenler
    getBestSellers("FEMALE"),
    getBestSellers("MALE"),
    getFeaturedProducts(), // Öne çıkan ürünler (ProductShowcase için)
    getCategories(), // Kategoriler
  ]);

  return (
    <>

      <ByltStyleHero />
      <div className="py-4">
        <HomeCategoryRail categories={categories} />
      </div>
      <div className="py-4">
        <EditorialBanner />
      </div>
      <ProductShowcase products={featuredProducts} />
      {/* <CategoryShowcase 
        categories={[
          { label: "SWEATSHIRT", href: "/sweatshirt" },
          { label: "BRA", href: "/bra" },
          { label: "UNDERWEAR", href: "/underwear" },
          { label: "SOCKS", href: "/socks" },
        ]}
        products={featuredProducts.slice(0, 4)}
      /> */}
      {/* <CollectionCarousel /> */}
      <SplitShowcase />
      <TabbedProductCarousel
        newArrivals={newArrivals}
        bestSellers={[...bestSellersWomen, ...bestSellersMen]}
        recommended={newArrivals}
      />
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
    </>
  );
}
