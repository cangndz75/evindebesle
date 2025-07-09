import CategorySection from "./_components/CategorySection";
import Footer from "./_components/Footer";
import FooterBanner from "./_components/FooterBanner";
import Hero from "./_components/Hero";
import FaqSection from "./_components/home/FaqSection";
import HowItWorksSection from "./_components/HowItWorksSection";
import PetTypeSelector from "./_components/PetTypeSelector";
import SearchBox from "./_components/SearchBox";
import Services from "./_components/Services";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SearchBox />
      <Services />
      <PetTypeSelector />
      <CategorySection />
      <HowItWorksSection />
      <FaqSection />
      <FooterBanner />
      <Footer />
    </>
  );
}
