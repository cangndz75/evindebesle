"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { editorialTiles } from "@/lib/homeData";

export default function EditorialTiles() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {editorialTiles.map((tile, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link href={tile.href} className="group block relative h-[500px] md:h-[600px] overflow-hidden">
                <Image
                  src={tile.image}
                  alt={tile.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-3">
                    {tile.title}
                  </h3>
                  {tile.subtitle && (
                    <p className="text-sm md:text-base text-white/90 font-light mb-4 max-w-md">
                      {tile.subtitle}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-2 text-white font-light uppercase tracking-wide group-hover:gap-4 transition-all duration-300">
                    Hikayeyi Oku <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
