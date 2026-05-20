"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  changePasswordFormSchema,
  getZodErrorMessage,
  PASSWORD_POLICY_HINT,
} from "@/lib/validation/auth";

export default function PasswordChange() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    const validated = changePasswordFormSchema.safeParse({ current, next, confirm });
    if (!validated.success) {
      toast.error(getZodErrorMessage(validated.error));
      return;
    }

    setSaving(true);
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current: validated.data.current,
        next: validated.data.next,
      }),
    });
    setSaving(false);

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      toast.success("Şifreniz güncellendi.");
      setCurrent("");
      setNext("");
      setConfirm("");
      return;
    }

    toast.error(typeof data?.error === "string" ? data.error : "Şifre güncellenemedi.");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-black mb-2">Mevcut Şifre</label>
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="h-11 border-gray-300 focus:border-black focus:ring-black rounded-lg"
            placeholder="Mevcut şifrenizi girin"
            autoComplete="current-password"
          />
          <p className="mt-1.5 text-xs text-gray-500 font-light">
            Şifrenizi değiştirmek için mevcut şifrenizi girmeniz gerekmektedir.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">Yeni Şifre</label>
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="h-11 border-gray-300 focus:border-black focus:ring-black rounded-lg"
            placeholder="Yeni şifrenizi girin"
            autoComplete="new-password"
            maxLength={64}
          />
          <p className="mt-1.5 text-xs text-gray-500 font-light">{PASSWORD_POLICY_HINT}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">Yeni Şifre (Tekrar)</label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 border-gray-300 focus:border-black focus:ring-black rounded-lg"
            placeholder="Yeni şifrenizi tekrar girin"
            autoComplete="new-password"
            maxLength={64}
          />
        </div>
      </div>

      <div className="pt-2">
        <Button
          onClick={handleChangePassword}
          disabled={saving}
          className="h-11 px-8 bg-black text-white hover:bg-black/90 rounded-full text-sm font-light"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Güncelleniyor...
            </span>
          ) : (
            "Şifreyi Güncelle"
          )}
        </Button>
      </div>
    </div>
  );
}
