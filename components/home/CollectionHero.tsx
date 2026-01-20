"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CollectionHero() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Sol - Görsel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative h-[500px] md:h-[600px] overflow-hidden group"
          >
            <Image
              src="/mock/active-collection.jpg"
              alt="Active Collection"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop";
              }}
            />
          </motion.div>

          {/* Sağ - İçerik */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <p className="text-sm md:text-base text-[#111]/60 font-light uppercase tracking-wider">
              Her Rutin İçin Tasarlanmış
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#111] leading-tight">
              Active Collection
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/men/active"
                className="px-8 py-3 bg-[#111] text-white font-light tracking-wide hover:bg-[#111]/90 transition-all duration-300 text-sm md:text-base uppercase text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2"
              >
                ERKEK
              </Link>
              <Link
                href="/women/active"
                className="px-8 py-3 bg-[#111] text-white font-light tracking-wide hover:bg-[#111]/90 transition-all duration-300 text-sm md:text-base uppercase text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2"
              >
                KADIN
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
