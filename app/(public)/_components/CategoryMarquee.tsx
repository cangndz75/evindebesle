"use client";

import Marquee from "react-fast-marquee";
import Image from "next/image";

const items = [
  {
    label: "Şehir Stili",
    color: "text-green-800",
    img: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=800&auto=format&fit=crop",
  },
  {
    label: "Minimal Koleksiyon",
    color: "text-orange-500",
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
  },
  {
    label: "Aksesuar Dünyası",
    color: "text-gray-600",
    img: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop",
  },
];

export default function CategoryMarquee() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto">
        <Marquee pauseOnHover gradient={false} speed={40}>
          <div className="flex gap-12 items-center px-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-3 min-w-max">
                <div className="w-12 h-12 relative rounded-md overflow-hidden">
                  <Image src={item.img} alt={item.label} fill className="object-cover" />
                </div>
                <span className={`text-2xl font-semibold ${item.color}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </Marquee>
      </div>
    </section>
  );
}
