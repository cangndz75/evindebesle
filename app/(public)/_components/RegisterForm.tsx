"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AuthHeader from "./AuthHeader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleRegister = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Kayıt başarısız.");
          return;
        }

        const otpRes = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!otpRes.ok) {
          toast.error("Kod gönderilemedi.");
          return;
        }

        toast.success("Kayıt başarılı! Kod gönderildi.");
        router.push(`/verify?email=${email}`);
      } catch {
        toast.error("Bir hata oluştu.");
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <AuthHeader title="Kayıt Ol" subtitle="Seni aramızda görmek harika!" />

      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Adınız"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          type="email"
          placeholder="Email adresi"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-2 text-sm text-muted-foreground"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Gizle" : "Göster"}
          </button>
        </div>

        <Button disabled={pending} onClick={handleRegister} className="w-full">
          {pending ? "Kayıt olunuyor..." : "Kayıt Ol"}
        </Button>
      </div>

      <div className="text-sm text-center text-muted-foreground pt-4">
        Hesabın var mı?{" "}
        <Link
          href="/login"
          className="text-violet-700 font-semibold hover:underline"
        >
          Giriş Yap
        </Link>
      </div>
    </div>
  );
}
