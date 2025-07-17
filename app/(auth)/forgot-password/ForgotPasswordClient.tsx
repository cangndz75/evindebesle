"use client";

import { useState, useTransition, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [isSent, setIsSent] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 dakika
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email) return toast.error("Lütfen e-posta girin.");

    startTransition(async () => {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setIsSent(true);
        toast.success("Şifre sıfırlama bağlantısı gönderildi.");
        setCountdown(300);
      } else {
        const data = await res.json();
        toast.error(data.error || "Bir hata oluştu.");
      }
    });
  };

  const handleResend = async () => {
    if (!email) return toast.error("E-posta adresi bulunamadı.");

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      toast.success("Bağlantı yeniden gönderildi.");
      setCountdown(300);
    } else {
      toast.error("Gönderilirken bir hata oluştu.");
    }
  };

  useEffect(() => {
    if (!isSent || countdown <= 0) return;
    const interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(interval);
  }, [isSent, countdown]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString();
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted relative">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ←
        </button>
        <span className="text-sm font-semibold">EvindeBesle</span>
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-10 space-y-6 text-center">
        {!isSent ? (
          <>
            <h1 className="text-3xl font-bold">Şifremi Unuttum</h1>
            <p className="text-sm text-muted-foreground">
              Kayıtlı e-posta adresinizi girin, şifre sıfırlama bağlantısı
              gönderelim.
            </p>

            <Input
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
              className="text-base h-12"
            />

            <Button
              onClick={handleSubmit}
              disabled={pending || !email}
              className="w-full h-12 text-base"
            >
              {pending ? "Gönderiliyor..." : "Şifre Sıfırlama Linki Gönder"}
            </Button>

            <p className="text-center text-xs text-gray-500">
              Şifre sıfırlama e-postası spam klasörüne düşebilir. Lütfen kontrol
              edin.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Bağlantı Gönderildi…</h1>

            <p className="text-sm text-muted-foreground">
              Şifre yenileme bağlantısını{" "}
              <span className="font-medium text-foreground">{email}</span>{" "}
              adresine gönderdik. Linke tıklayarak şifrenizi
              değiştirebilirsiniz.
            </p>

            <p className="text-xs text-gray-500">
              ℹ️ Lütfen gelen kutunuzu veya spam (önemsiz) klasörünü kontrol
              edin.
            </p>

            <p className="text-xs text-muted-foreground italic">
              Şifre sıfırlama talebiniz alındı. E-posta adresiniz sistemimizde
              kayıtlıysa, bir bağlantı kısa süre içinde gönderilecektir.
            </p>

            <Button
              onClick={handleResend}
              disabled={countdown > 0}
              className="w-full"
            >
              {countdown > 0
                ? `Tekrar Gönder (${formatTime(countdown)})`
                : "Tekrar Gönder"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
