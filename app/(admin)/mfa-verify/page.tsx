"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MfaVerifyPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length < 6) {
      toast.error("Lütfen 6 haneli doğrulama kodunu girin.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/mfa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Doğrulama başarısız.");
        setCode("");
        return;
      }

      await update({ mfaVerified: true });
      toast.success("Doğrulama başarılı!");
      router.push("/dashboard");
    } catch {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (session && !session.user?.mfaPending) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white border border-gray-200 shadow-sm">
        <h1 className="text-xl font-bold text-center mb-2 uppercase tracking-wider">
          İki Aşamalı Doğrulama
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Authenticator uygulamanızdaki 6 haneli kodu veya yedek kodunuzu girin.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-6"
        >
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={20}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
            className="text-center text-2xl tracking-[0.5em] h-14 bg-gray-50 border-gray-200 rounded-none"
            autoFocus
          />

          <Button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full h-12 bg-[#111] text-white hover:bg-[#333] uppercase tracking-wider text-sm font-semibold rounded-none"
          >
            {loading ? "Doğrulanıyor..." : "Doğrula"}
          </Button>
        </form>
      </div>
    </div>
  );
}
