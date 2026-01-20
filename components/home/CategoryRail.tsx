"use client";

import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/homeData";

export default function CategoryRail() {
  return (
    <section className="w-full bg-white py-12 md:py-16">
      <div className="w-full px-4 md:px-6">
        <div className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="flex-shrink-0 w-48 md:w-56 group snap-start"
            >
              <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-200">
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 192px, 224px"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop";
                  }}
                />
              </div>
              <h3 className="text-sm md:text-base font-light text-[#111] text-center uppercase tracking-wide">
                {category.label}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
