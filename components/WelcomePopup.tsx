"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { WelcomePopupSettings } from "@/lib/welcome-popup";
import { interpolateSuccessMessage } from "@/lib/welcome-popup";
import LegalDocumentModal, {
  type LegalDocumentType,
} from "@/components/legal/LegalDocumentModal";
import ConsentTextWithLegalLinks from "@/components/legal/ConsentTextWithLegalLinks";
import {
  WELCOME_POPUP_STORAGE_KEY,
  notifyWelcomePopupClosed,
} from "@/lib/popup-coordination";

const STORAGE_KEY = WELCOME_POPUP_STORAGE_KEY;

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function WelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [settings, setSettings] = useState<WelcomePopupSettings | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [legalModal, setLegalModal] = useState<LegalDocumentType | null>(null);

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
    notifyWelcomePopupClosed();
  };

  useEffect(() => {
    if (!isVisible || legalModal) return;

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "loading") closePopup();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isVisible, legalModal, status]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(() => closePopup(), 4500);
    return () => clearTimeout(timer);
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings?.showEmailForm) {
      closePopup();
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/welcome-popup/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Bir hata oluştu."
        );
      }

      setStatus("success");
      localStorage.setItem(STORAGE_KEY, "true");
      notifyWelcomePopupClosed();
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Bir hata oluştu."
      );
    }
  };

  if (!settings?.isEnabled || !isVisible) return null;

  const successBody = settings.successMessage
    ? interpolateSuccessMessage(settings.successMessage, email)
    : `İndirim kodunu ${email} adresine gönderdik.`;

  return (
    <>
      <div
        className="fixed inset-0 z-10050 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-popup-title"
        onClick={status === "loading" ? undefined : closePopup}
      >
        <div
          className="relative z-10 flex min-h-[320px] w-full max-w-md flex-col justify-center overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={closePopup}
            disabled={status === "loading"}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-black disabled:opacity-40"
            aria-label="Kapat"
          >
            &times;
          </button>

          {status === "success" ? (
            <div className="animate-in fade-in zoom-in-95 duration-500 px-2 py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600">
                ✓
              </div>
              <h2 className="mb-3 text-2xl font-bold text-gray-900">
                {settings.successTitle}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600">
                {successBody}
              </p>
            </div>
          ) : (
            <>
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

              <h2
                id="welcome-popup-title"
                className="mb-2 text-2xl font-bold text-gray-900"
              >
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
                    disabled={status === "loading"}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50"
                  />

                  {status === "error" && (
                    <p className="text-left text-xs text-red-500">
                      {errorMessage}
                    </p>
                  )}

                  <div className="flex items-start gap-2 text-left text-xs text-gray-500">
                    <input
                      id="welcome-popup-consent"
                      type="checkbox"
                      required
                      disabled={status === "loading"}
                      className="mt-1 shrink-0 rounded border-gray-300"
                    />
                    <label
                      htmlFor="welcome-popup-consent"
                      className="cursor-pointer leading-relaxed"
                    >
                      <ConsentTextWithLegalLinks
                        text={settings.consentText}
                        onOpen={setLegalModal}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="flex h-12 w-full items-center justify-center rounded-lg bg-black px-4 py-3 font-semibold text-white transition-transform active:scale-[0.98] hover:bg-gray-800 disabled:opacity-70"
                  >
                    {status === "loading" ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      settings.buttonText
                    )}
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
            </>
          )}
        </div>
      </div>
      <LegalDocumentModal
        type={legalModal}
        onClose={() => setLegalModal(null)}
      />
    </>
  );
}
