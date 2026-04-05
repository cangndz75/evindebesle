"use client";

import { useEffect, useState } from "react";

type AnnouncementBannerProps = {
  variant?: "default" | "pink";
  className?: string;
  position?: "fixed" | "static";
};

export default function AnnouncementBanner({ 
  variant = "default", 
  className = "",
  position = "static" 
}: AnnouncementBannerProps) {
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/company-settings");
        if (res.ok) {
          const data = await res.json();
          setFreeShippingThreshold(data.freeShippingThreshold || 999);
        } else {
          setFreeShippingThreshold(999);
        }
      } catch (error) {
        console.error("Error fetching company settings:", error);
        setFreeShippingThreshold(999);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const bgColor = variant === "pink" ? "bg-pink-400" : "bg-black";
  const textColor = "text-white";
  const positionClass = position === "fixed" ? "fixed top-0 left-0 right-0 z-[60]" : "w-full";

  if (loading) {
    return (
      <div className={`${className} ${positionClass}`}>
        <div className={`${bgColor} ${textColor} text-[11px] tracking-[0.18em] uppercase text-center h-9 flex items-center justify-center`}>
          ÜCRETSİZ KARGO
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} ${positionClass}`}>
      <div className={`${bgColor} ${textColor} text-[11px] tracking-[0.18em] uppercase text-center h-9 flex items-center justify-center`}>
        ÜCRETSİZ KARGO {freeShippingThreshold ? `${Math.round(freeShippingThreshold)}₺+` : "999₺+"}
      </div>
    </div>
  );
}
