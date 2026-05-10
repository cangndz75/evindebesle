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
  const [announcementMessages, setAnnouncementMessages] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/company-settings");
        if (res.ok) {
          const data = await res.json();
          setFreeShippingThreshold(data.freeShippingThreshold || 999);
          setAnnouncementMessages(
            Array.isArray(data.announcementMessages)
              ? data.announcementMessages
                  .filter((message: unknown): message is string => typeof message === "string")
                  .map((message: string) => message.trim())
                  .filter(Boolean)
              : []
          );
        } else {
          setFreeShippingThreshold(999);
          setAnnouncementMessages([]);
        }
      } catch (error) {
        console.error("Error fetching company settings:", error);
        setFreeShippingThreshold(999);
        setAnnouncementMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

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
