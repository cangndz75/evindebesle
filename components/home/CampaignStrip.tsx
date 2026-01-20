"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const campaigns = [
  "YILI YENİDEN TANIMLA | MODERN RESET",
  "YENİ KOLEKSİYON | ŞİMDİ KEŞFET",
  "ÖZEL KAMPANYA | %20 İNDİRİM",
];

export default function CampaignStrip() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % campaigns.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  };

  return (
    <div className="w-full bg-black text-white text-xs md:text-sm py-2.5 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={prev}
            className="hover:opacity-70 transition-opacity"
            aria-label="Önceki kampanya"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span className="font-light text-center flex-1">
            {campaigns[currentIndex]}
          </span>
          <button
            onClick={next}
            className="hover:opacity-70 transition-opacity"
            aria-label="Sonraki kampanya"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
