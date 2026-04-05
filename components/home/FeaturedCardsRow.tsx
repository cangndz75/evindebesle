"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { featuredCards } from "@/lib/homeData";
import { useMediaQuery } from "../../hooks/use-media-query";
import { useRef } from "react";

function useParallax(value: MotionValue<number>, distance: number) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

function MobileCard({ card, index }: { card: any; index: number }) {
  return (
    <div className="flex-shrink-0 w-[85vw] snap-center group">
      
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 mb-4">
        {(card as any).videoUrl ? (
          <video
            src={(card as any).videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={card.image}
            alt={card.title}
            fill
            className="object-cover transition-transform duration-500 group-active:scale-105"
            sizes="85vw"
            priority={index === 0}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1200&auto=format&fit=crop";
            }}
          />
        )}
      </div>

      
      <div className="text-center px-4">
        <h3 className="text-2xl font-serif text-[#111] mb-2 tracking-tight">
          {card.title}
        </h3>
        <p className="text-sm text-[#111]/70 font-light mb-4 leading-relaxed line-clamp-2">
          {card.description}
        </p>
        <Link
          href={card.href}
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] border-b border-[#111]/30 pb-1 text-[#111]"
        >
          Keşfet <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function FeaturedCardsRow() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <section className="w-full bg-white py-8 md:py-16 border-t border-gray-100">
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-8 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {featuredCards.map((card, index) => (
            <MobileCard key={index} card={card} index={index} />
          ))}
        </div>
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
