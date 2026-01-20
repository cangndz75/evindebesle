"use client";

import { useState } from "react";

const categories = [
  { id: "new", label: "Yeni" },
  { id: "bestsellers", label: "En Çok Satanlar" },
  { id: "sets", label: "Takımlar" },
  { id: "lace", label: "Danteller" },
  { id: "comfort", label: "Günlük Konfor" },
  { id: "shapewear", label: "Shapewear" },
  { id: "nightwear", label: "Gecelik" },
  { id: "body", label: "Body" },
];

export default function CategoryFilters() {
  const [activeCategory, setActiveCategory] = useState("new");

  return (
    <section className="w-full bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-4 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-light whitespace-nowrap transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-black text-white"
                  : "bg-white text-black border border-gray-300 hover:border-gray-500"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
