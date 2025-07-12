import { Footer } from "react-day-picker";
import CategorySection from "../_components/CategorySection";
import FooterBanner from "../_components/FooterBanner";
import Hero from "../_components/Hero";
import FaqSection from "../_components/home/FaqSection";
import HowItWorksSection from "../_components/HowItWorksSection";
import PetTypeSelector from "../_components/PetTypeSelector";
import SearchBox from "../_components/SearchBox";


export default function HomePage() {
  return (
    <>
      <Hero />
      <SearchBox />
      <HowItWorksSection />
      <PetTypeSelector />
      <CategorySection />
      <FaqSection />
      <FooterBanner />
      <Footer />
    </>
  );
}
