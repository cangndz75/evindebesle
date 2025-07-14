import ContactForm from "./_components/ContactForm"
import ContactInfo from "./_components/ContactInfo"
import Navbar from "../_components/Navbar"
import Footer from "../_components/Footer"

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <section className="relative z-0 py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <ContactForm />
            <ContactInfo />
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
