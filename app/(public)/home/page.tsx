import Image from "next/image";
import CategoryMarquee from "../_components/CategoryMarquee";
import CategorySection from "../_components/CategorySection";
import Footer from "../_components/Footer";
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
      {/* <SearchBox /> */}
      <HowItWorksSection />
      <section className="my-6 sm:my-10">
        <div className="w-full">
          <Image
            src="https://res.cloudinary.com/dlahfchej/image/upload/v1754850604/banner2_upt5zl.png"
            alt="Randevu banner"
            width={7924}
            height={1139}
            className="w-full h-auto object-contain rounded-xl shadow-lg"
            sizes="100vw"
            priority
          />
        </div>
      </section>
      <PetTypeSelector />
      <CategoryMarquee />
      <FaqSection />
      <FooterBanner />
    </>
  );
}
