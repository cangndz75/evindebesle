"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HeroSplitCta() {
  return (
    <section className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden bg-black flex items-center justify-center">
      
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            
            <p className="text-sm md:text-base text-white font-light mb-6 uppercase tracking-wider">
              Gardırobunu Yenile, Konforu Yeniden Tanımla
            </p>

            
            <h1 className="text-7xl md:text-8xl lg:text-9xl xl:text-[12rem] font-serif font-light text-white mb-12 leading-[0.9]">
              <span className="block">MODERN</span>
              <span className="block">RESET</span>
            </h1>

            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/women"
                className="px-10 py-4 border-2 border-white text-white font-light tracking-wider hover:bg-white hover:text-black transition-all duration-300 text-sm md:text-base uppercase text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                KADIN
              </Link>
              <Link
                href="/collections"
                className="px-10 py-4 border-2 border-white text-white font-light tracking-wider hover:bg-white hover:text-black transition-all duration-300 text-sm md:text-base uppercase text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                KOLEKSİYONLAR
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
