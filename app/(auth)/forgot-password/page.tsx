"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">🔑 Şifremi Unuttum</h1>
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
        />

        <Button
          onClick={handleSubmit}
          disabled={pending || !email}
          className="w-full"
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
