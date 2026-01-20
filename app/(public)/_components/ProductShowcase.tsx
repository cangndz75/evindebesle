"use client";

import Image from "next/image";

const products = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    type: "portrait",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    type: "landscape",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    type: "portrait",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    type: "portrait",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    type: "portrait",
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    type: "portrait",
  },
  {
    id: 7,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    type: "portrait",
  },
  {
    id: 8,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop",
    type: "portrait",
  },
];

export default function ProductShowcase() {
  return (
    <section className="w-full bg-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="relative aspect-[3/4] overflow-hidden group cursor-pointer"
            >
              <Image
                src={product.image}
                alt={`Ürün ${product.id}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
