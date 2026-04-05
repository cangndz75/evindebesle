"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

const heroImages = [
  {
    left: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=2070&auto=format&fit=crop",
    right: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=2070&auto=format&fit=crop",
  },
  {
    left: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=2070&auto=format&fit=crop",
    right: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=2070&auto=format&fit=crop",
  },
];

const gridImages = [
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
];

export default function CollectionSection() {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextHero = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevHero = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentHeroIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
        setTimeout(() => setIsTransitioning(false), 500);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentHeroIndex, isTransitioning]);

  return (
    <section className="w-full bg-white">
      
      <div className="relative w-full">
        <div className="relative flex h-[70vh] md:h-[85vh] overflow-hidden">
          
          <div className="relative w-1/2 h-full overflow-hidden group">
            <Image
              src={heroImages[currentHeroIndex].left}
              alt="Koleksiyon görseli sol"
              fill
              className={`object-cover transition-all duration-700 group-hover:scale-105 ${isTransitioning ? "opacity-0" : "opacity-100"
                }`}
              sizes="50vw"
              priority
            />
          </div>

          
          <div className="relative w-1/2 h-full overflow-hidden group">
            <Image
              src={heroImages[currentHeroIndex].right}
              alt="Koleksiyon görseli sağ"
              fill
              className={`object-cover transition-all duration-700 group-hover:scale-105 ${isTransitioning ? "opacity-0" : "opacity-100"
                }`}
              sizes="50vw"
              priority
            />
          </div>

          
          {heroImages.length > 1 && (
            <>
              <button
                onClick={prevHero}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
                aria-label="Önceki görsel"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextHero}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
                aria-label="Sonraki görsel"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center z-10 animate-fade-in">
            <p className="text-sm md:text-base tracking-wider text-black/80 font-light mb-1">
              YENİ
            </p>
            <p className="text-lg md:text-2xl tracking-widest text-black font-light mb-1">
              DARK VELVET KOLEKSİYONU
            </p>
            <p className="text-xs md:text-sm tracking-wider text-black/70 font-light">
              YENİ SEZON
            </p>
          </div>

          
          {heroImages.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!isTransitioning) {
                      setIsTransitioning(true);
                      setCurrentHeroIndex(index);
                      setTimeout(() => setIsTransitioning(false), 500);
                    }
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${index === currentHeroIndex
                      ? "w-8 bg-black"
                      : "w-1.5 bg-black/30 hover:bg-black/50"
                    }`}
                  aria-label={`Görsel ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      
      <div className="w-full bg-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-0">
            {gridImages.map((src, index) => (
              <div
                key={index}
                className="relative aspect-[3/4] overflow-hidden group cursor-pointer"
              >
                <Image
                  src={src}
                  alt={`Koleksiyon görseli ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 14vw"
                />
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
