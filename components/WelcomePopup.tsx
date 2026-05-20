"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { WelcomePopupSettings } from "@/lib/welcome-popup";

const STORAGE_KEY = "welcomePopupSeen";

export default function WelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [settings, setSettings] = useState<WelcomePopupSettings | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/welcome-popup");
        if (!res.ok) return;
        const data = await res.json();
        if (!data.isEnabled) return;
        setSettings(data as WelcomePopupSettings);
      } catch {
        // Sessizce devam et
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (!settings?.isEnabled) return;

    const hasSeenPopup = localStorage.getItem(STORAGE_KEY);
    if (hasSeenPopup) return;

    const delay = Math.max(0, settings.delayMs ?? 3000);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [settings]);

  const closePopup = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    if (settings.showEmailForm && email) {
      setSubmitting(true);
      try {
        const res = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          const { toast } = await import("sonner");
          toast.success("Kaydınız alındı!");
        } else {
          const err = await res.json().catch(() => ({}));
          const { toast } = await import("sonner");
          toast.error(err.error || "Kayıt başarısız oldu.");
          return;
        }
      } catch {
        const { toast } = await import("sonner");
        toast.error("Bir hata oluştu.");
        return;
      } finally {
        setSubmitting(false);
      }
    }

    closePopup();
  };

  if (!settings?.isEnabled || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl text-center">
        <button
          type="button"
          onClick={closePopup}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-black"
          aria-label="Kapat"
        >
          &times;
        </button>

        {settings.imageUrl && (
          <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg">
            <Image
              src={settings.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
            />
          </div>
        )}

        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          {settings.title}
        </h2>
        <p className="mb-6 text-sm text-gray-600 whitespace-pre-line">
          {settings.description}
        </p>

        {settings.showEmailForm ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={settings.emailPlaceholder}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black"
            />
            <label className="flex items-start gap-2 text-left text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-1 rounded border-gray-300"
              />
              <span>{settings.consentText}</span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition-transform active:scale-[0.98] hover:bg-gray-800 disabled:opacity-60"
            >
              {submitting ? "Gönderiliyor..." : settings.buttonText}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={closePopup}
            className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition-transform active:scale-[0.98] hover:bg-gray-800"
          >
            {settings.buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
