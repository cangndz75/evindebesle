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
import { newArrivals, bestSellersWomen, womensBrands, mensBrands } from "@/lib/homeData";

export const metadata = {
  title: "Dark Velvet - Premium İç Çamaşırı",
  description:
    "Dark Velvet - Erkek ve kadın premium iç çamaşırı koleksiyonu. Zarif tasarımlar, konforlu kumaşlar ve modern stil.",
};

export default function HomePage() {
  return (
    <>
      <ByltStyleHero />
      <ProductShowcase />
      <EditorialBanner />
      <BrandShowcase title="WOMENS BRANDS" items={womensBrands} />
      <BrandShowcase title="MEN'S BRANDS" items={mensBrands} />
      <CollectionCarousel />
      <SplitShowcase />
      <TwoUpEditorialTiles />
      <CategoryRail />
      <FeaturedCardsRow />
      <ProductCarousel title="Yeni Gelenler" products={newArrivals} viewAllLink="/women/new" />
      <EditorialTiles />
      <TabbedBestSellers />
      <NewsletterSignup />
      <FooterAccordion />
    </>
  );
}
