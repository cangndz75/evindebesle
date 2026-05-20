"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookieConsent";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (consent) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        setIsVisible(true);
        timers.push(setTimeout(() => setIsAnimating(true), 50));
      }, 1000)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleAccept = () => {
    setIsAnimating(false);
    localStorage.setItem(STORAGE_KEY, "true");
    setTimeout(() => setIsVisible(false), 500);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez bildirimi"
      className={`fixed z-9999 flex flex-col gap-4 bg-white/80 p-5 backdrop-blur-xl transition-all duration-500 ease-out dark:bg-zinc-950/80 sm:flex-row sm:items-center sm:gap-6 bottom-0 left-0 right-0 w-full rounded-t-2xl border-t border-gray-200 dark:border-zinc-800 sm:bottom-6 sm:left-6 sm:right-auto sm:w-[480px] sm:rounded-2xl sm:border sm:shadow-2xl ${
        isAnimating
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 sm:translate-y-10"
      }`}
    >
      <div className="flex-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        <p className="text-justify">
          Alışveriş deneyiminizi iyileştirmek ve yasal düzenlemelere uygun hizmet
          sunabilmek amacıyla çerezler (cookies) kullanıyoruz. Detaylı bilgiye{" "}
          <Link
            href="/privacy"
            className="font-semibold text-black underline decoration-gray-300 underline-offset-4 transition-colors hover:decoration-black dark:text-white dark:decoration-zinc-600 dark:hover:decoration-white"
          >
            Gizlilik ve Çerez Politikası
          </Link>{" "}
          sayfamızdan erişebilirsiniz.
        </p>
      </div>

      <div className="flex shrink-0 flex-col justify-end sm:flex-row">
        <button
          type="button"
          onClick={handleAccept}
          className="w-full whitespace-nowrap rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition-all active:scale-95 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 sm:w-auto"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
