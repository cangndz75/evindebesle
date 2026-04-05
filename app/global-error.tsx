"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="min-h-screen bg-[#F7F5F2] text-[#111] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-black/10 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Beklenmeyen bir hata olustu</h2>
          <p className="text-sm text-gray-600 mt-3">
            Sorun otomatik olarak kaydedildi. Lutfen tekrar deneyin.
          </p>
          <button
            onClick={reset}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-black/90"
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
