"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getZodErrorMessage,
  PASSWORD_POLICY_HINT,
  resetPasswordFormSchema,
} from "@/lib/validation/auth";

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

    const validated = resetPasswordFormSchema.safeParse({ password, confirmPassword });
    if (!validated.success) {
      toast.error(getZodErrorMessage(validated.error));
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: validated.data.password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("Şifre başarıyla yenilendi.");
        router.push("/auth-tabs");
        return;
      }

      toast.error(
        typeof data?.error === "string"
          ? data.error
          : "Geçersiz veya süresi dolmuş bağlantı."
      );
    });
  };

  return (
    <div className="h-full flex items-center justify-center px-4 bg-muted relative">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ←
        </button>
        <span className="text-sm font-semibold">Dark Velvet</span>
      </div>

      <div className="w-full max-w-lg bg-white p-10 rounded-2xl shadow-2xl space-y-6">
        <h1 className="text-3xl font-bold text-center">🔐 Yeni Şifre Belirle</h1>
        <p className="text-sm text-muted-foreground text-center">Yeni bir şifre giriniz</p>

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Yeni şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            className="h-12 text-base"
            autoComplete="new-password"
            maxLength={64}
          />
          <Input
            type="password"
            placeholder="Şifreyi tekrar girin"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={pending}
            className="h-12 text-base"
            autoComplete="new-password"
            maxLength={64}
          />
          <p className="text-xs text-muted-foreground leading-relaxed">{PASSWORD_POLICY_HINT}</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={pending || !password || !confirmPassword}
          className="w-full h-12 text-base"
        >
          {pending ? "Kaydediliyor..." : "Şifreyi Kaydet"}
        </Button>
      </div>
    </div>
  );
}
