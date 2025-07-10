"use client";

import { useState, useTransition } from "react";
import AuthHeader from "./AuthHeader";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const [googlePending, startGoogleTransition] = useTransition();

  async function signInWithGoogle() {
    startGoogleTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Başarıyla giriş yaptınız!");
          },
          onError: (error) => {
            toast.error(`Giriş başarısız!`);
          },
        },
      });
    });
  }
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md space-y-6">
      <AuthHeader title="Giriş Yap" subtitle="Tekrar hoş geldiniz!" />

      <form className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-md bg-background border-input"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Şifre"
            className="w-full px-4 py-2 border rounded-md bg-background border-input"
          />
          <button
            type="button"
            className="absolute right-3 top-2 text-sm text-muted-foreground"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Gizle" : "Göster"}
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 rounded-md bg-lime-500 hover:bg-lime-600 transition text-white font-semibold"
        >
          Giriş Yap
        </button>
      </form>
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted" />
        </div>
        <span className="relative bg-background px-2 text-muted-foreground text-sm">
          veya
        </span>
      </div>

      <Button
        disabled={googlePending}
        type="button"
        onClick={signInWithGoogle}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border bg-white hover:bg-gray-100 transition font-medium"
      >
        {googlePending ? (
          <span className="loader" />
        ) : (
          <img src="/google.svg" alt="Google Icon" className="w-5 h-5" />
        )}
        <h1 className="text-sm text-gray-800">
          {googlePending ? "Giriş yapılıyor..." : "Google ile Giriş Yap"}
        </h1>
      </Button>
    </div>
  );
}
