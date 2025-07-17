"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
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
        toast.success("Şifre sıfırlama bağlantısı e-posta ile gönderildi.");
        setEmail("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Bir hata oluştu.");
      }
    });
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

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-10 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">🔑 Şifremi Unuttum</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Kayıtlı e-posta adresinizi girin, şifre sıfırlama bağlantısı
            gönderelim.
          </p>
        </div>

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
      </div>
    </div>
  );
}
