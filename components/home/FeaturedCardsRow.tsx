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
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const y = useParallax(scrollYProgress, 300);
  const opacity = useTransform(scrollYProgress, [0.8, 1], [1, 0]);

  return (
    <section className="relative h-[100vh] w-full flex items-center justify-center overflow-hidden bg-black snap-center">
      <div ref={ref} className="absolute inset-0 w-full h-full">
        {(card as any).videoUrl ? (
          <video
            src={(card as any).videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <Image
            src={card.image}
            alt={card.title}
            fill
            className="object-cover opacity-80"
            sizes="100vw"
            priority={index === 0}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1200&auto=format&fit=crop";
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 text-center px-6 max-w-lg"
      >
        <h3 className="text-4xl md:text-5xl font-serif text-white mb-4 tracking-tight">
          {card.title}
        </h3>
        <p className="text-lg text-white/90 font-light mb-8 leading-relaxed">
          {card.description}
        </p>
        <Link
          href={card.href}
          className="inline-flex items-center gap-3 text-sm font-light uppercase tracking-[0.2em] border-b border-white/30 pb-2 hover:border-white transition-all duration-300 text-white"
        >
          Keşfet <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </section>
  );
}

export default function FeaturedCardsRow() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <section className="w-full bg-black">
        <div className="flex flex-col snap-y snap-mandatory h-auto">
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
