"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function VerifyClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [pending, startTransition] = useTransition();
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendCooldown]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast.error("6 haneli kodu girin.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });

      if (res.ok) {
        toast.success("Doğrulama başarılı!");
        router.push("/");
      } else {
        toast.error("Kod geçersiz veya süresi dolmuş.");
      }
    });
  };

  const handleResend = async () => {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      toast.success("Kod tekrar gönderildi.");
      setResendCooldown(60);
    } else {
      toast.error("Gönderim başarısız.");
    }
  };

  return (
    <div className="max-w-md mx-auto pt-20 px-4 space-y-6 text-center">
      <h1 className="text-2xl font-bold">E-posta Doğrulama</h1>
      <p className="text-muted-foreground">
        {email} adresine gönderilen 6 haneli kodu giriniz.
      </p>

      <div className="flex justify-center gap-2">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            className="w-12 h-12 text-center text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        ))}
      </div>

      <Button
        onClick={handleVerify}
        disabled={pending || code.includes("")}
        className="w-full"
      >
        {pending ? "Doğrulanıyor..." : "Kodu Doğrula"}
      </Button>

      <div className="text-sm text-muted-foreground">
        Kod gelmedi mi?{" "}
        <Button
          variant="link"
          size="sm"
          onClick={handleResend}
          disabled={resendCooldown > 0}
        >
          {resendCooldown > 0
            ? `Tekrar gönder (${resendCooldown})`
            : "Kod Gönder"}
        </Button>
      </div>
    </div>
  );
}
