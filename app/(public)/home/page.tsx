import nextDynamic from "next/dynamic";
import { cache } from "react";
import ByltStyleHero from "@/components/home/ByltStyleHero";
import ProductShowcase from "@/components/home/ProductShowcase";
import HomeCategoryRail from "@/components/home/HomeCategoryRail";
import CampaignBanner from "@/components/home/CampaignBanner";
import { getActiveCampaignBanner } from "@/lib/campaign-banner.server";

const EditorialBanner = nextDynamic(() => import("@/components/home/EditorialBanner"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
});
const SplitShowcase = nextDynamic(() => import("@/components/home/SplitShowcase"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse" />,
});
const FeaturedCardsRow = nextDynamic(() => import("@/components/home/FeaturedCardsRow"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
});
const EditorialTiles = nextDynamic(() => import("@/components/home/EditorialTiles"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
});
const NewsletterSignup = nextDynamic(() => import("@/components/home/NewsletterSignup"), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
});
import type { Product } from "@/lib/homeData";
const TabbedProductCarousel = nextDynamic(() => import("@/components/home/TabbedProductCarousel"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse" />,
});
import { prisma } from "@/lib/db";
import { resolveSwatchHex } from "@/lib/color-swatch";

export const revalidate = 3600;

function isMissingTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  );
}

function parseImages(images: string | null): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatProduct(product: any, type: "new-arrivals" | "best-sellers" | "featured"): Product {
  const firstColor = product.colors[0];
  const colorImages = firstColor?.images ? parseImages(firstColor.images) : [];
  const mainImage = product.primaryImage || product.image || colorImages[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";

  let hoverImage = product.secondaryImage;
  if (!hoverImage && colorImages.length > 1) {
    hoverImage = colorImages[1];
  }
  if (!hoverImage && product.colors && product.colors.length > 1) {
    for (let i = 1; i < product.colors.length; i++) {
      const otherColorImages = product.colors[i]?.images ? parseImages(product.colors[i].images) : [];
      if (otherColorImages.length > 0) {
        hoverImage = otherColorImages[0];
        break;
      }
    }
  }
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
      badge: (product.originalPrice && product.originalPrice > product.price) ? "İndirim" : "Yeni",
      colors: product.colors.map((c: any) => {
        const images = parseImages(c.images);
        return {
          id: c.id,
          name: c.name || "",
          value: resolveSwatchHex({ name: c.name, hexCode: c.hexCode }),
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
    badge: (product.originalPrice && product.originalPrice > product.price) ? "İndirim" : "Yeni",
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

const getTabbedProducts = cache(async (tabName: string): Promise<Product[]> => {
  try {
    const items = await prisma.tabbedCarouselProduct.findMany({
      where: { tab: tabName },
      orderBy: { order: "asc" },
      include: {
        product: {
          include: {
            colors: {
              take: 5,
              select: {
                id: true,
                name: true,
                hexCode: true,
                images: true,
                variants: {
                  select: { id: true, variantCode: true, colorId: true, sizeId: true, stock: true, price: true }
                }
              }
            },
            sizes: { select: { id: true, name: true, stock: true } },
            sizeOptions: { select: { id: true, name: true } },
            _count: { select: { orderItems: true } }
          }
        }
      }
    });

    return items.map((item: any) => formatProduct(item.product, "featured"));
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    console.error(`Error fetching ${tabName} products:`, error);
    return [];
  }
});

const getShowcaseProducts = cache(async (): Promise<Product[]> => {
  try {
    const items = await prisma.showcase.findMany({
      orderBy: { order: "asc" },
      include: {
        product: {
          include: {
            colors: {
              take: 5,
              select: {
                id: true,
                name: true,
                hexCode: true,
                images: true,
                variants: {
                  select: { id: true, variantCode: true, colorId: true, sizeId: true, stock: true, price: true }
                }
              }
            },
            sizes: { select: { id: true, name: true, stock: true } },
            sizeOptions: { select: { id: true, name: true } },
            _count: { select: { orderItems: true } }
          }
        }
      }
    });
    return items.map((item: any) => formatProduct(item.product, "featured"));
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    console.error("Error fetching showcase products:", error);
    return [];
  }
});

type CategoryForRail = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
};

const getCategories = cache(async (): Promise<CategoryForRail[]> => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, showOnHome: true },
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
});

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
  const [newArrivalsTab, bestSellersTab, recommendedTab, showcaseProducts, categories, campaignBanner] = await Promise.all([
    getTabbedProducts("new-arrivals"),
    getTabbedProducts("best-sellers"),
    getTabbedProducts("recommended"),
    getShowcaseProducts(),
    getCategories(),
    getActiveCampaignBanner(),
  ]);

  return (
    <>

      <ByltStyleHero />
      <div className="py-4">
        <HomeCategoryRail categories={categories} />
      </div>
      {campaignBanner && (
        <div className="py-4">
          <CampaignBanner
            badgeText={campaignBanner.badgeText}
            title={campaignBanner.title}
            description={campaignBanner.description}
            buttonText={campaignBanner.buttonText}
            buttonUrl={campaignBanner.buttonUrl}
            subNote={campaignBanner.subNote}
            discountTiers={campaignBanner.discountTiers}
            themeColor={campaignBanner.themeColor}
          />
        </div>
      )}
      <EditorialBanner />
      <ProductShowcase products={showcaseProducts} />
      
      
      <SplitShowcase />
      <TabbedProductCarousel
        newArrivals={newArrivalsTab}
        bestSellers={bestSellersTab}
        recommended={recommendedTab}
      />
      
      
      <FeaturedCardsRow />
      
      <EditorialTiles />
      
      <NewsletterSignup />
    </>
  );
}
