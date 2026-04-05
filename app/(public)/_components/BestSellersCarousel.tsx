"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useState } from "react";

const bestSellers = [
  {
    id: 1,
    name: "KADIN JOURNEY HI-PILE JACKET",
    price: 1200,
    color: "Driftwood",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    badge: "YENİ",
    colors: ["#d4a574", "#000000", "#ffffff", "#8b6f47"],
  },
  {
    id: 2,
    name: "DRIFT UZUN KOLLU",
    price: 450,
    color: "Koyu Gri",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    colors: ["#000000", "#808080", "#ffffff", "#4a5568", "#2d3748", "+6 daha"],
  },
  {
    id: 3,
    name: "SERENE SHACKET",
    price: 800,
    color: "Siyah",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    colors: ["#000000", "#d4a574", "#8b6f47", "#556b2f", "#2d3748", "#808080", "+5 daha"],
  },
  {
    id: 4,
    name: "KADIN GÜNLÜK PANTOLON",
    price: 1280,
    color: "Koyu Gri",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    colors: ["#2d3748", "#556b2f", "#808080", "#8b6f47", "#000000", "#4a5568", "+6 daha"],
  },
];

export default function BestSellersCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % bestSellers.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + bestSellers.length) % bestSellers.length);
  };

  return (
    <section className="w-full bg-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-light text-black mb-8 text-center md:text-left">
          KADIN EN ÇOK SATANLAR
        </h2>

        <div className="relative">
          
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {bestSellers.map((product) => (
                <div
                  key={product.id}
                  className="min-w-full flex-shrink-0 px-2"
                >
                  <div className="max-w-sm mx-auto">
                    <div className="relative aspect-[3/4] mb-4 overflow-hidden group cursor-pointer">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 384px"
                      />
                      {product.badge && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-white text-black text-xs font-light">
                          {product.badge}
                        </div>
                      )}
                      <button className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full transition-colors">
                        <Heart className="w-4 h-4 text-black" />
                      </button>
                    </div>
                    <h3 className="text-sm font-light text-black mb-1">{product.name}</h3>
                    <p className="text-sm font-light text-black mb-1">{product.price} ₺</p>
                    <p className="text-xs text-gray-600 font-light mb-2">{product.color}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {product.colors.slice(0, 6).map((color, idx) => (
                        <div
                          key={idx}
                          className={`w-4 h-4 rounded border ${
                            typeof color === "string" && color.includes("+")
                              ? "bg-transparent border-gray-300 flex items-center justify-center"
                              : "border-gray-300"
                          }`}
                          style={
                            typeof color === "string" && !color.includes("+")
                              ? { backgroundColor: color }
                              : {}
                          }
                        >
                          {typeof color === "string" && color.includes("+") && (
                            <span className="text-[8px] text-gray-600">{color}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white border border-gray-300 p-2 hover:bg-gray-50 transition-colors z-10"
            aria-label="Önceki"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white border border-gray-300 p-2 hover:bg-gray-50 transition-colors z-10"
            aria-label="Sonraki"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
