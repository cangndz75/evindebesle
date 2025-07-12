"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import AuthHeader from "./AuthHeader";
import { authClient } from "@/lib/auth-client";
import { getSession, signIn } from "next-auth/react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();
  const [otpPending, startOtpTransition] = useTransition();

  const handleLoginWithPassword = () => {
    startTransition(async () => {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      await new Promise((r) => setTimeout(r, 500));

      const session = await getSession();

      if (!session) {
        toast.error("Oturum alınamadı.");
        return;
      }

      toast.success("Giriş başarılı!");
      console.log("Session:", session, session.user, session.user?.isAdmin);

      const isAdmin = session.user?.isAdmin === true;
      window.location.href = isAdmin ? "/admin" : "/home";
    });
  };

  const handleLoginWithOtp = () => {
    startOtpTransition(async () => {
      try {
        await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "sign-in",
          fetchOptions: {
            onSuccess: () => {
              toast.success("Doğrulama kodu gönderildi!");
              router.push("/verify-request");
            },
            onError: () => {
              toast.error("Kod gönderilemedi.");
            },
          },
        });
      } catch {
        toast.error("Bir hata oluştu.");
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <AuthHeader title="Giriş Yap" subtitle="Tekrar hoş geldiniz!" />

      <div className="space-y-4">
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

        <Button
          disabled={pending}
          onClick={handleLoginWithPassword}
          className="w-full"
        >
          {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>

        <Button
          variant="outline"
          onClick={handleLoginWithOtp}
          disabled={otpPending}
          className="w-full"
        >
          {otpPending ? "Gönderiliyor..." : "Şifresiz Giriş (OTP)"}
        </Button>
      </div>

      <div className="text-sm text-center text-muted-foreground pt-4">
        Hesabın yok mu?{" "}
        <Link
          href="/register"
          className="text-violet-700 font-semibold hover:underline"
        >
          Kayıt Ol
        </Link>
      </div>
    </div>
  );
}
