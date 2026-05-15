"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LogOut, Clock } from "lucide-react";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;     // 30 dakika hareketsizlik
const WARNING_BEFORE_MS = 5 * 60 * 1000;    // Son 5 dakikada uyarı göster
const TICK_INTERVAL_MS = 15_000;             // 15 saniyede bir kontrol

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
];

export default function AdminIdleGuard() {
  const router = useRouter();
  const lastActivityRef = useRef(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const loggingOutRef = useRef(false);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) setShowWarning(false);
  }, [showWarning]);

  const doLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;

    toast.error("Hareketsizlik nedeniyle oturumunuz sonlandırıldı.");
    await signOut({ redirect: false });
    router.replace("/auth-tabs?reason=idle_timeout");
  }, [router]);

  useEffect(() => {
    const handler = () => {
      lastActivityRef.current = Date.now();
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, handler, { passive: true });
    }
    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, handler);
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = IDLE_TIMEOUT_MS - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        doLogout();
        return;
      }

      if (remaining <= WARNING_BEFORE_MS) {
        setShowWarning(true);
        setRemainingSeconds(Math.ceil(remaining / 1000));
      } else {
        if (showWarning) setShowWarning(false);
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [doLogout, showWarning]);

  useEffect(() => {
    if (!showWarning) return;

    const countdown = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = IDLE_TIMEOUT_MS - elapsed;

      if (remaining <= 0) {
        clearInterval(countdown);
        doLogout();
        return;
      }
      setRemainingSeconds(Math.ceil(remaining / 1000));
    }, 1000);

    return () => clearInterval(countdown);
  }, [showWarning, doLogout]);

  if (!showWarning) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>

          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Oturum Süresi Dolmak Üzere
          </h2>
          <p className="mb-6 text-sm text-gray-600">
            Hareketsizlik nedeniyle oturumunuz{" "}
            <span className="font-semibold text-red-600 tabular-nums">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>{" "}
            içinde sonlandırılacak.
          </p>

          <div className="flex w-full gap-3">
            <button
              onClick={resetActivity}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Oturumu Sürdür
            </button>
            <button
              onClick={doLogout}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
