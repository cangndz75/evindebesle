"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

const products = [
  {
    id: 1,
    image: null,
    name: "Dantel Detaylı Balkonet Sütyen",
    price: 899,
    badge: "Yeni",
    badgePosition: "top-right",
    colors: ["#000000", "#ffffff", "#d4a574", "#8b6f47", "#e8d5c4"],
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    name: "Seamless Günlük Külot",
    price: 349,
    badge: null,
    colors: ["#000000", "#ffffff", "#d4a574", "#8b6f47", "#e8d5c4"],
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    name: "Saten İpek Takım",
    price: 1299,
    originalPrice: 1599,
    badge: "-20%",
    badgePosition: "top-left",
    colors: ["#e8d5c4", "#000000", "#ffffff", "#8b6f47"],
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    name: "Transparan Dantel Body",
    price: 1499,
    badge: "Yeni",
    badgePosition: "top-right",
    colors: ["#000000", "#ffffff", "#8b6f47"],
  },
];

export default function ProductGrid() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter((f) => f !== filter));
  };

  return (
    <section className="w-full bg-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {activeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => removeFilter(filter)}
                className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-light hover:bg-gray-200 transition-colors rounded-full"
              >
                {filter}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={() => setActiveFilters([])}
              className="text-sm text-gray-600 hover:text-black font-light underline"
            >
              Tümünü Temizle
            </button>
          </div>
        )}

        
        <div className="flex justify-between items-center mb-8">
          <p className="text-sm text-gray-600 font-light">
            {products.length} ürün
          </p>
          <select className="text-sm font-light border-b border-gray-300 pb-1 bg-transparent focus:outline-none focus:border-black transition-colors">
            <option>Sırala</option>
            <option>Fiyat: Düşükten Yükseğe</option>
            <option>Fiyat: Yüksekten Düşüğe</option>
            <option>En Yeni</option>
            <option>En Çok Satan</option>
          </select>
        </div>

        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              
              <div className="relative aspect-3/4 mb-4 overflow-hidden bg-gray-100">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-black" />
                )}
                
                {product.badge && (
                  <div
                    className={`absolute ${
                      product.badgePosition === "top-left" ? "top-3 left-3" : "top-3 right-3"
                    } ${
                      product.badge.includes("%")
                        ? "bg-gray-200 text-black px-2 py-1 rounded"
                        : "bg-white text-black w-10 h-10 rounded-full flex items-center justify-center"
                    } text-xs font-light`}
                  >
                    {product.badge}
                  </div>
                )}
              </div>

              
              <div>
                <h3 className="text-sm font-light text-black mb-2">{product.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {product.originalPrice} ₺
                    </span>
                  )}
                  <span className="text-sm font-light text-black">
                    {product.price} ₺
                  </span>
                </div>
                
                <div className="flex gap-2">
                  {product.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        
        <div className="text-center">
          <button className="px-8 py-3 border border-black text-black font-light tracking-wide hover:bg-black hover:text-white transition-all duration-300">
            Daha Fazla Ürün Yükle
          </button>
        </div>
      </div>
    </section>
  );
}
