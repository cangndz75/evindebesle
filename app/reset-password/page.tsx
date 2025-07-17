"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      toast.error("Geçersiz bağlantı.");
      return;
    }

    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Şifreler uyuşmuyor.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (res.ok) {
      toast.success("Şifreniz başarıyla güncellendi!");
      router.push("/login");
    } else {
      const data = await res.json();
      toast.error(data?.error || "Bir hata oluştu.");
    }
  };

  return (
    <div className="max-w-md mx-auto pt-20 px-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">🔐 Yeni Şifre Belirle</h1>

      <Input
        type="password"
        placeholder="Yeni Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Yeni Şifre (Tekrar)"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? "Kaydediliyor..." : "Şifremi Güncelle"}
      </Button>
    </div>
  );
}
