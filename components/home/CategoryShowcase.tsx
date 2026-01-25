"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/homeData";

interface CategoryItem {
  label: string;
  href: string;
  image?: string;
}

interface CategoryShowcaseProps {
  categories: CategoryItem[];
  products?: Product[];
}

export default function CategoryShowcase({
  categories = [
    { label: "SWEATSHIRT", href: "/sweatshirt" },
    { label: "BRA", href: "/bra" },
    { label: "UNDERWEAR", href: "/underwear" },
    { label: "SOCKS", href: "/socks" },
  ],
  products = [],
}: CategoryShowcaseProps) {
  // Eğer products varsa, onları kullan ama categories'deki linkleri kullan
  const displayItems = products.length >= 4
    ? products.slice(0, 4).map((product, idx) => ({
      label: categories[idx]?.label || product.title,
      href: categories[idx]?.href || `/products/${product.slug || product.id}`, // Her zaman categories'deki href'i kullan
      image: product.image,
      hoverImage: product.hoverImage,
      product: product,
    }))
    : categories.slice(0, 4).map((cat) => ({
      label: cat.label,
      href: cat.href,
      image: cat.image,
      hoverImage: undefined,
      product: undefined,
    }));

  return (
    <section className="w-full bg-white overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 w-full">
        {displayItems.map((item, idx) => {
          const defaultImage = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";
          const itemImage = item.image || defaultImage;
          const isLast = idx === displayItems.length - 1;

          return (
            <Link
              key={idx}
              href={item.href}
              className={`group block relative ${!isLast ? 'border-r border-gray-200' : ''}`}
            >
              {/* Product/Category Image */}
              <div className="relative w-full aspect-square overflow-hidden bg-white">
                <Image
                  src={itemImage}
                  alt={item.label}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  loading={idx < 2 ? "eager" : "lazy"}
                />
                {item.hoverImage && (
                  <Image
                    src={item.hoverImage}
                    alt={`${item.label} hover`}
                    fill
                    className="object-contain object-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 absolute inset-0"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                )}
                {item.product?.badge && (
                  <div className="absolute top-2 left-2 bg-[#111] text-white text-[10px] px-2 py-1 uppercase tracking-wide z-10">
                    {item.product.badge}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
