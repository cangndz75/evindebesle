"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ResetPasswordClient() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const handleSubmit = () => {
    if (!token) {
      toast.error("Geçersiz bağlantı.");
      return;
    }

    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        toast.success("Şifre başarıyla yenilendi.");
        router.push("/auth/login");
      } else {
        toast.error("Geçersiz veya süresi dolmuş bağlantı.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Yeni Şifre Belirle</h1>
        <p className="text-sm text-gray-500 text-center">
          Yeni bir şifre giriniz
        </p>

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Yeni şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Şifreyi tekrar girin"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={pending || !password || !confirmPassword}
          className="w-full"
        >
          {pending ? "Kaydediliyor..." : "Şifreyi Kaydet"}
        </Button>
      </div>
    </div>
  );
}
