"use client";

import { useHeaderStore } from "@/lib/stores/headerStore";

export default function AnnouncementBar() {
  const { freeShippingThreshold } = useHeaderStore();

  const threshold = Math.round(freeShippingThreshold || 999);

  return (
    <div className="w-full bg-black text-white text-xs md:text-sm py-2.5">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-center">
          <span className="font-light tracking-wide">
            ÃœCRETSÄ°Z KARGO {threshold}â‚º+
          </span>
        </div>
      </div>
    </div>
  );
}
