"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { featuredCards } from "@/lib/homeData";

export default function FeaturedCardsRow() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {featuredCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link
                href={card.href}
                className="group block h-full"
              >
                <div className="relative aspect-[4/5] mb-6 overflow-hidden bg-gray-200">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop";
                    }}
                  />
                </div>
                <h3 className="text-2xl md:text-3xl font-light text-[#111] mb-3">
                  {card.title}
                </h3>
                <p className="text-sm md:text-base text-[#111]/70 font-light mb-4 leading-relaxed">
                  {card.description}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-light text-[#111] uppercase tracking-wide group-hover:gap-4 transition-all duration-300">
                  Keşfet <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
