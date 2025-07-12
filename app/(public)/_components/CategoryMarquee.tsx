"use client";

import Marquee from "react-fast-marquee";
import Image from "next/image";

const items = [
  {
    label: "Evcil Hayvan Bakımı",
    color: "text-green-800",
    img: "/cat.jpg",
  },
  {
    label: "Evcil Hayvan Besleme",
    color: "text-orange-500",
    img: "/feeding.jpg",
  },
  {
    label: "Mama ve Aksesuar Satışı",
    color: "text-gray-600",
    img: "/activities.jpg",
  },
//   {
//     label: "cat whisperers",
//     color: "text-gray-700",
//     img: "/cat.jpg",
//   },
//   {
//     label: "dementia care",
//     color: "text-pink-400",
//     img: "/elder.jpg",
//   },
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
