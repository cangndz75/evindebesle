"use client";

import { useState, useEffect } from "react";

const slides = [
  {
    title: "Evde Hayvan Bakımı",
    desc: "Evcil dostlarınıza en iyi bakımı sağlamak için buradayız.",
    image:
      "https://res.cloudinary.com/dlahfchej/image/upload/v1752619387/15_iaalt8.png",
  },
  {
    title: "Güvenli ve Sevgi Dolu",
    desc: "Ev ortamında, sevgi dolu bakıcılarla tanışın.",
    image:
      "https://res.cloudinary.com/dlahfchej/image/upload/v1752619398/6_umwbmf.png",
  },
  {
    title: "Kolay Erişim",
    desc: "İhtiyacınız olan hizmetlere tek tıkla ulaşın.",
    image:
      "https://res.cloudinary.com/dlahfchej/image/upload/v1752619388/8_kkoxpr.png",
  },
];

export default function OnboardingSlides() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center text-center text-white overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100 z-10" : "opacity-0 z-0"
          } bg-no-repeat bg-center bg-contain`}
          style={{ backgroundImage: `url(${slide.image})` }}
        />
      ))}

      <div className="relative max-w-md px-6 z-20">
        <h3 className="text-3xl font-bold mb-2">{slides[index].title}</h3>
        <p className="text-lg mb-6">{slides[index].desc}</p>
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i === index ? "bg-violet-600" : "bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
