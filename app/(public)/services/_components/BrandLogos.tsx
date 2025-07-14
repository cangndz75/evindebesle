import Image from "next/image"

const logos = [
  "https://images.unsplash.com/photo-1625233920822-092650756654?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1625233920822-092650756654?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1625233920822-092650756654?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1625233920822-092650756654?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1625233920822-092650756654?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
]

export default function BrandLogos() {
  return (
    <section className="flex w-full bg-black overflow-hidden">
      <div className="w-16 md:w-28 bg-[url('/patterns/pattern.png')] bg-cover bg-center shrink-0" />

      <div className="flex-1 relative py-10">
        <div className="whitespace-nowrap animate-marquee flex gap-16 items-center">
          {[...logos, ...logos].map((src, i) => (
            <Image
              key={i}
              src={src}
              alt={`brand-${i}`}
              width={120}
              height={60}
              className="h-10 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition duration-300"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
