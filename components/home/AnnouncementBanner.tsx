"use client";

import { useEffect, useState } from "react";
import { useCompanySettingsStore } from "@/lib/stores/companySettingsStore";

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
  const { freeShippingThreshold, announcementMessages, isHydrated, hydrate } = useCompanySettingsStore();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const loading = !isHydrated;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const bgColor = variant === "pink" ? "bg-pink-400" : "bg-black";
  const textColor = "text-white";
  const positionClass = position === "fixed" ? "fixed top-0 left-0 right-0 z-[60]" : "w-full";
  const defaultMessage = `ÜCRETSİZ KARGO ${freeShippingThreshold ? `${Math.round(freeShippingThreshold)}₺+` : "999₺+"}`;
  const displayMessages = [defaultMessage, ...announcementMessages];

  useEffect(() => {
    setCurrentMessageIndex(0);
  }, [defaultMessage, announcementMessages.length]);

  useEffect(() => {
    if (displayMessages.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % displayMessages.length);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [displayMessages.length]);

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
        {displayMessages[currentMessageIndex]}
      </div>
    </div>
  );
}
