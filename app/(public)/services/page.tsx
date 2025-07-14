import Footer from "../_components/Footer"
import Navbar from "../_components/Navbar"
import BrandLogos from "./_components/BrandLogos"
import HeroSection from "./_components/HeroSection"
import ServiceGrid from "./_components/ServiceGrid"

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="space-y-24 mt-0">
        <HeroSection />
        <BrandLogos />
        <ServiceGrid />
      </main>
      <Footer />
    </>
  )
}
