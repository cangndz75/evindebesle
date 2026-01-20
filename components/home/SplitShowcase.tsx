"use client";

import Image from "next/image";
import Link from "next/link";

type SplitItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
};

const splitItems: SplitItem[] = [
  {
    id: "hero",
    title: "Roamknit Koleksiyonu",
    subtitle: "Stil ve Konforla Rahatla",
    href: "/collections/roamknit",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: "tee",
    title: "LUX Rahat T-Shirt",
    subtitle: "Rahat Kesimli Premium Kumaş",
    href: "/products/lux-relaxed-tee",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "jogger",
    title: "Günlük Jogger Pantolon",
    subtitle: "Günlük Kullanım İçin Modern Kesim",
    href: "/products/everyday-jogger",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1400&auto=format&fit=crop",
  },
];

export default function SplitShowcase() {
  return (
    <section className="w-full bg-white py-6 md:py-0">
      {/* Mobile: All items stacked vertically with gaps */}
      <div className="md:hidden space-y-4 px-2">
        {splitItems.map((item, index) => (
          <Link
            key={item.id}
            href={item.href}
            className="relative group block overflow-hidden"
          >
            <div className="relative aspect-[4/3] bg-white">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes="100vw"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-xs md:text-sm font-light mb-1">
                  {item.subtitle}
                </p>
                <h3 className="text-xl md:text-2xl font-light mb-3">
                  {item.title}
                </h3>
                <span className="inline-block px-5 py-2.5 border border-white text-xs tracking-wider uppercase group-hover:bg-white group-hover:text-black transition-all duration-300">
                  ŞİMDİ ALIŞVERİŞ YAP
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: Original layout */}
      <div className="hidden md:grid grid-cols-2 min-h-[850px] bg-white">
        <Link
          href={splitItems[0].href}
          className="relative group overflow-hidden"
        >
          <Image
            src={splitItems[0].image}
            alt={splitItems[0].title}
            fill
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            sizes="50vw"
            priority
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <p className="text-sm font-light mb-1">
              {splitItems[0].subtitle}
            </p>
            <h3 className="text-2xl md:text-3xl font-light mb-4">
              {splitItems[0].title}
            </h3>
            <span className="inline-block px-6 py-3 border border-white text-sm tracking-wider uppercase group-hover:bg-white group-hover:text-black transition-all duration-300">
              ŞİMDİ ALIŞVERİŞ YAP
            </span>
          </div>
        </Link>

        <div className="grid grid-rows-2">
          {splitItems.slice(1).map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="relative group overflow-hidden"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-black/25" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm font-light mb-1">
                  {item.subtitle}
                </p>
                <h4 className="text-xl md:text-2xl font-light mb-3">
                  {item.title}
                </h4>
                <span className="inline-block px-5 py-2.5 border border-white text-xs tracking-wider uppercase group-hover:bg-white group-hover:text-black transition-all duration-300">
                  ŞİMDİ ALIŞVERİŞ YAP
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
