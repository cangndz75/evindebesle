"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [pending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown > 0) {
      const interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldown]);

  const handleChange = (val: string, index: number) => {
    if (!/^\d?$/.test(val)) return;
    const newCode = [...code];
    newCode[index] = val;
    setCode(newCode);
    if (val && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) return toast.error("6 haneli kod gerekli.");
    startTransition(async () => {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });

      if (res.ok) {
        toast.success("Doğrulama başarılı.");
        router.push("/");
      } else {
        toast.error("Kod geçersiz veya süresi dolmuş.");
      }
    });
  };

  const handleResend = async () => {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast.success("Kod tekrar gönderildi.");
      setCooldown(60);
    } else {
      toast.error("Kod gönderilemedi.");
    }
  };

  return (
    <div className="grid md:grid-cols-2 min-h-screen">
      <div
        className="hidden md:block bg-muted bg-cover bg-center"
        style={{ backgroundImage: "url('/7.png')" }}
      />

      <div className="flex flex-col justify-center items-center px-6">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-center">E-Posta Doğrulama</h2>
          <p className="text-center text-muted-foreground">
            Mail adresinize gönderilen 6 haneli kodu giriniz.
          </p>

          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputsRef.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                className="w-12 h-12 text-xl text-center border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ))}
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={pending}>
            {pending ? "Doğrulanıyor..." : "Kodu Doğrula"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Kod gelmedi mi?{" "}
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className="text-blue-600 underline disabled:opacity-50"
            >
              {cooldown > 0 ? `Tekrar Gönder (${cooldown})` : "Tekrar Gönder"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
