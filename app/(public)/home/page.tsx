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

// Performans için ISR - 5 dakikada bir yenilenir
export const revalidate = 300;

async function getNewArrivals(gender?: "MALE" | "FEMALE"): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000";
    const url = new URL("/api/home/products", baseUrl);
    url.searchParams.set("type", "new-arrivals");
    url.searchParams.set("limit", "8");
    if (gender) {
      url.searchParams.set("gender", gender);
    }
    const response = await fetch(url.toString(), { 
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch new arrivals");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    return [];
  }
}

async function getBestSellers(gender?: "MALE" | "FEMALE"): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000";
    const url = new URL("/api/home/products", baseUrl);
    url.searchParams.set("type", "best-sellers");
    url.searchParams.set("limit", "8");
    if (gender) {
      url.searchParams.set("gender", gender);
    }
    const response = await fetch(url.toString(), { 
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch best sellers");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching best sellers:", error);
    return [];
  }
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000";
    const url = new URL("/api/home/products", baseUrl);
    url.searchParams.set("type", "featured");
    url.searchParams.set("limit", "8");
    const response = await fetch(url.toString(), { 
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch featured products");
    }
    return await response.json();
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
