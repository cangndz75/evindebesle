import Image from "next/image";

const logos = ["/rcanin.png", "https://res.cloudinary.com/dlahfchej/image/upload/v1752619387/13_lmksmp.png", "https://res.cloudinary.com/dlahfchej/image/upload/v1752621515/proplan_j3q4d1.png"];

export default function BrandLogos() {
  return (
    <section className="flex w-full bg-black overflow-hidden">
      <div className="w-20 md:w-36 bg-[url('/patterns/pattern.png')] bg-cover bg-center shrink-0" />

      <div className="flex-1 relative py-14">
        <div className="whitespace-nowrap animate-marquee flex gap-20 items-center">
          {[...logos, ...logos].map((src, i) => (
            <Image
              key={i}
              src={src}
              alt={`brand-${i}`}
              width={160}
              height={80}
              className="h-16 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition duration-300"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
