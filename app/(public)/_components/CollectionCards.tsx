"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

const collections = [
  {
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    category: "ÖZEL GÜNLER İÇİN",
    title: "Bridal",
    cta: "KEŞFET",
  },
  {
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    category: "GÜNLÜK KONFOR",
    title: "Everyday Comfort",
    cta: "KEŞFET",
  },
  {
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    category: "ŞEKİLLENDİRİCİ",
    title: "Sculpting",
    cta: "KEŞFET",
  },
];

export default function CollectionCards() {
  return (
    <section className="w-full bg-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {collections.map((collection, index) => (
            <div
              key={index}
              className="relative group cursor-pointer overflow-hidden rounded-lg aspect-3/4"
            >
              
              <div className="absolute inset-0">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>

              
              <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-8">
                <p className="text-white/90 text-xs md:text-sm font-light tracking-wider mb-2 uppercase">
                  {collection.category}
                </p>
                <h3 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white font-serif font-light mb-6">
                  {collection.title}
                </h3>
                <button className="inline-flex items-center gap-2 text-white text-sm md:text-base font-light tracking-wider uppercase w-fit border border-white/50 px-6 py-2.5 hover:bg-white hover:text-black transition-all duration-300">
                  {collection.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
