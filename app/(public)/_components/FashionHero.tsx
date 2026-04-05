"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=2070&auto=format&fit=crop",
    title: "WINTER E",
    subtitle: "Online",
    subtitle2: "Mağazalarda",
    cta1: "YENİ SEZONU KEŞFET",
    cta2: "TAKIMLARI GÖR",
    note: "*stoklarla sınırlı",
  },
];

export default function FashionHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        setTimeout(() => setIsTransitioning(false), 500);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [currentSlide, isTransitioning]);

  const current = heroSlides[currentSlide];

  return (
    <section className="relative w-full h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-[85vh] xl:h-[90vh] overflow-hidden bg-gray-100">
      {/* Arka Plan Görseli */}
      <div className="absolute inset-0">
        <Image
          src={current.image}
          alt={current.title}
          fill
          className={`object-cover object-center transition-opacity duration-700 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
          sizes="100vw"
          priority
        />
      </div>

      {/* İçerik - Sol Tarafta */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 w-full">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Tag */}
            <div className="mb-4 sm:mb-5 md:mb-6">
              <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 bg-gray-200/90 backdrop-blur-sm text-gray-700 text-[10px] sm:text-xs md:text-sm font-light tracking-wider rounded-full">
                YENİ KOLEKSİYON
              </span>
            </div>

            {/* Başlık */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-light text-black mb-3 sm:mb-4 leading-tight">
              {current.title}
            </h1>

            {/* Alt Başlıklar */}
            <div className="flex items-center gap-4 mb-6 sm:mb-7 md:mb-8">
              <p className="text-sm sm:text-base md:text-lg text-gray-700 font-light">
                {current.subtitle}
              </p>
              {current.subtitle2 && (
                <>
                  <span className="text-gray-400">•</span>
                  <p className="text-sm sm:text-base md:text-lg text-gray-700 font-light">
                    {current.subtitle2}
                  </p>
                </>
              )}
            </div>

            {/* CTA Butonları */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-7 md:mb-8">
              <button className="px-5 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 border border-gray-800 text-gray-800 font-light tracking-wide hover:bg-gray-800 hover:text-white transition-all duration-300 text-xs sm:text-sm md:text-base bg-transparent whitespace-nowrap">
                {current.cta1}
              </button>
              <button className="px-5 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 border border-gray-800 text-gray-800 font-light tracking-wide hover:bg-gray-800 hover:text-white transition-all duration-300 text-xs sm:text-sm md:text-base bg-transparent whitespace-nowrap">
                {current.cta2}
              </button>
            </div>

            {/* Not - Alt Sol Köşe */}
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 font-light">
              {current.note}
            </p>
          </div>
        </div>
      </div>

      {/* Navigasyon Okları */}
      {heroSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white backdrop-blur-sm text-gray-800 p-2 sm:p-2.5 md:p-3 rounded-full transition-all duration-300 shadow-sm"
            aria-label="Önceki slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white backdrop-blur-sm text-gray-800 p-2 sm:p-2.5 md:p-3 rounded-full transition-all duration-300 shadow-sm"
            aria-label="Sonraki slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Pagination Dots - Alt Orta */}
      {heroSlides.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? "w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-800"
                  : "w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 hover:bg-gray-600"
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
