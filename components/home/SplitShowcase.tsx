"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

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
    title: "Yeni Sezon Koleksiyonu",
    subtitle: "Zarafet ve Modernlik",
    href: "/collections/women",
    image: "https://res.cloudinary.com/dlahfchej/image/upload/v1771710275/ChatGPT_Image_14_%C5%9Eub_2026_22_21_11_p3swce.png",
  },
  {
    id: "tee",
    title: "Premium Temeller",
    subtitle: "Lüks Dokunuş, Her Gün",
    href: "/collections/men",
    image: "https://res.cloudinary.com/dlahfchej/image/upload/v1771709896/banner4_lwozfs.png",
  },
  {
    id: "jogger",
    title: "Modern Günlük Stil",
    subtitle: "Konforunuzu Bir Üst Seviyeye Taşıyın",
    href: "/category/pants",
    image: "https://res.cloudinary.com/dlahfchej/image/upload/v1771709884/banner3_wo0qk0.png",
  },
];

function StickyMobileCard({ item, index, total }: { item: SplitItem; index: number; total: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.6]);

  return (
    <div ref={containerRef} className="h-screen w-full sticky top-[64px]">
      <motion.div
        style={{ scale, opacity }}
        className="relative h-full w-full overflow-hidden"
      >
        <Link
          href={item.href}
          className="relative block h-full w-full"
        >
          <Image
            src={item.image}
            alt={item.title}
            fill
            className={`${item.id === 'hero' ? 'object-contain' : 'object-cover'} object-center`}
            sizes="100vw"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-16 left-8 right-8 text-white">
            <p className="text-sm font-light mb-1">
              {item.subtitle}
            </p>
            <h3 className="text-3xl font-light mb-4">
              {item.title}
            </h3>
            <span className="inline-block px-6 py-3 border border-white text-sm tracking-wider uppercase">
              ŞİMDİ ALIŞVERİŞ YAP
            </span>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}

export default function SplitShowcase() {
  return (
    <section className="w-full bg-white py-0">
      
      <div className="md:hidden">
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 py-8 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {splitItems.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex-shrink-0 w-[85vw] snap-center group"
            >
              
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className={`${item.id === 'hero' ? 'object-contain' : 'object-cover'} object-center transition-transform duration-500 group-active:scale-105`}
                  sizes="85vw"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              
              <div className="mt-4 text-center">
                <h3 className="text-xl font-light text-[#111] mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 font-light mb-3">
                  {item.subtitle}
                </p>
                <span className="inline-block px-5 py-2 border border-[#111] text-xs tracking-wider uppercase text-[#111]">
                  KEŞFET
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      
      <div className="hidden md:grid grid-cols-2 min-h-[850px] bg-white">
        <Link
          href={splitItems[0].href}
          className="relative group overflow-hidden bg-gray-50"
        >
          <Image
            src={splitItems[0].image}
            alt={splitItems[0].title}
            fill
            className="object-contain object-center transition-transform duration-700 group-hover:scale-105"
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
