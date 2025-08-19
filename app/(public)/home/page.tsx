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

export const metadata = {
  title: "Evinde Besle",
  description:
    "Tatile çıkarken kediniz veya köpeğiniz için güvenli bakım ve konaklama hizmetleri. Evcil hayvan oteli, evde bakım ve deneyimli bakıcılar bir arada.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* <SearchBox /> */}
      <HowItWorksSection />
      <section className="my-6 sm:my-10">
        <div className="w-full rounded-xl overflow-hidden shadow-lg">
          {/* Mobil (<= md) */}
          <div className="block md:hidden">
            <Image
              src="https://res.cloudinary.com/dlahfchej/image/upload/v1754852424/ChatGPT_Image_10_A%C4%9Fu_2025_22_00_12_gpotrr.png"
              alt="Randevu banner mobil"
              width={1536}
              height={1024}
              className="w-full h-auto object-contain"
              sizes="100vw"
              priority
            />
          </div>

          <div className="hidden md:block">
            <Image
              src="https://res.cloudinary.com/dlahfchej/image/upload/v1754850604/banner2_upt5zl.png"
              alt="Randevu banner web"
              width={7924}
              height={1139}
              className="w-full h-auto object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      </section>
      <PetTypeSelector />
      <CategoryMarquee />
      <FaqSection />
      <FooterBanner />
    </>
  );
}
