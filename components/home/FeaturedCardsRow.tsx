"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { featuredCards } from "@/lib/homeData";
import CurtainReveal from "./CurtainReveal";
import { useMediaQuery } from "../../hooks/use-media-query";

export default function FeaturedCardsRow() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <section className="w-full bg-black">
        <CurtainReveal>
          {featuredCards.map((card, index) => (
            <div key={index} className="relative w-full h-full group">
              <div className="absolute inset-0 overflow-hidden">
                {(card as any).videoUrl ? (
                  <video
                    src={(card as any).videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-[2s] scale-100 group-hover:scale-110"
                  />
                ) : (
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-[2s] scale-100 group-hover:scale-110"
                    sizes="100vw"
                    priority={index === 0}
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1200&auto=format&fit=crop";
                    }}
                  />
                )}
                {/* Visual Overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              <div className="absolute bottom-16 left-8 right-8 text-white z-10 transition-transform duration-700 group-hover:-translate-y-2">
                <h3 className="text-4xl md:text-5xl font-light mb-4 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-lg text-white/80 font-light mb-6 leading-relaxed max-w-md">
                  {card.description}
                </p>
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-3 text-sm font-light uppercase tracking-[0.2em] border-b border-white/30 pb-2 hover:border-white transition-all duration-300"
                >
                  Keşfet <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </CurtainReveal>
      </section>
    );
  }

  return (
    <section className="w-full bg-white py-16 md:py-24 px-6 md:px-12 lg:px-24">
      <div className="w-full max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {featuredCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2, ease: [0.25, 1, 0.5, 1] }}
            >
              <Link
                href={card.href}
                className="group block h-full overflow-hidden"
              >
                <div className="relative aspect-[4/5] mb-8 overflow-hidden bg-gray-50">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800&auto=format&fit=crop";
                    }}
                  />
                </div>
                <h3 className="text-3xl font-light text-[#111] mb-4 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-base text-[#111]/70 font-light mb-6 leading-relaxed">
                  {card.description}
                </p>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-[#111] uppercase tracking-[0.2em] group-hover:gap-4 transition-all duration-500 border-b border-transparent group-hover:border-black/20 pb-1">
                  Keşfet <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
