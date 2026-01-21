"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, getSession } from "next-auth/react";
import { authClient } from "@/lib/auth-client";

// Basit Footer Component
function AuthFooter() {
  return (
    <footer className="lg:hidden w-full bg-white border-t border-gray-200 py-6 px-6">
      <div className="max-w-md mx-auto">
        <div className="flex flex-col gap-4 text-xs text-gray-600">
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
            <Link href="/privacy" className="hover:text-black transition-colors">
              Gizlilik Politikası
            </Link>
            <Link href="/terms" className="hover:text-black transition-colors">
              Kullanım Koşulları
            </Link>
            <Link href="/contact" className="hover:text-black transition-colors">
              İletişim
            </Link>
            <Link href="/kvkk" className="hover:text-black transition-colors">
              KVKK
            </Link>
          </div>
          <p className="text-center text-gray-500">
            © 2026 Dark Velvet. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function AuthTabs() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();
  
  // Register states
  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerPending, startRegisterTransition] = useTransition();

  const handleLogin = () => {
    startTransition(async () => {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        const message =
          res.error === "CredentialsSignin"
            ? "E-posta adresi veya şifre hatalı."
            : res.error;
        toast.error(message);
        return;
      }

      await new Promise((r) => setTimeout(r, 500));

      const session = await getSession();

      if (!session) {
        toast.error("Oturum alınamadı.");
        return;
      }

      toast.success("Giriş başarılı!");
      const isAdmin = session.user?.isAdmin === true;
      window.location.href = isAdmin ? "/dashboard" : "/home";
    });
  };

  const handleRegister = () => {
    startRegisterTransition(async () => {
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email: registerEmail, password: registerPassword }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Kayıt başarısız.");
          return;
        }

        const otpRes = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: registerEmail }),
        });

        if (!otpRes.ok) {
          toast.error("Kod gönderilemedi.");
          return;
        }

        toast.success("Kayıt başarılı! Kod gönderildi.");
        router.push(`/verify?email=${registerEmail}`);
      } catch {
        toast.error("Bir hata oluştu.");
      }
    });
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Mobil: Üstte Banner */}
      <div className="lg:hidden relative bg-gray-100 w-full flex-shrink-0" style={{ minHeight: '40vh' }}>
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-xs uppercase tracking-widest mb-3 text-gray-600 font-light">
              TANITIM
            </div>
            <h2 className="text-4xl font-bold mb-4 text-black leading-tight">
              BYLT+<br />Rewards
            </h2>
            <p className="text-sm text-gray-700 mb-6 font-light leading-relaxed max-w-xs">
              Her alışverişte mağaza kredisi kazanın ve özel ödüllerin kilidini açın.
            </p>
            <Button
              variant="outline"
              className="bg-white text-[#111] hover:bg-gray-50 border-black uppercase tracking-wider text-sm font-light px-8 py-2.5 h-auto rounded-none"
            >
              Daha Fazla Bilgi
            </Button>
          </div>
        </div>
      </div>

      {/* Sol Taraf - Login/Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 sm:px-8 md:px-12 py-8 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Tablar */}
          <div className="flex mb-6 gap-2">
            <button
              className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition ${
                tab === "login"
                  ? "text-[#111] border-b-2 border-[#111]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => setTab("login")}
              type="button"
            >
              Giriş Yap
            </button>
            <button
              className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition ${
                tab === "register"
                  ? "text-[#111] border-b-2 border-[#111]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => setTab("register")}
              type="button"
            >
              Üye Ol
            </button>
          </div>

          {tab === "login" ? (
            <div className="space-y-5">
              <h2 className="text-2xl font-semibold text-[#111] uppercase tracking-wide mb-5">
                Kayıtlı Müşteriler
              </h2>

              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email Address*"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50 border-gray-200 h-12"
                />

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password*"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-50 border-gray-200 h-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Gizle" : "Göster"}
                  </button>
                </div>

                <Button
                  disabled={pending}
                  onClick={handleLogin}
                  className="w-full h-12 bg-[#111] text-white hover:bg-[#333] uppercase tracking-wider text-sm font-semibold"
                >
                  {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm pt-3">
                <Link
                  href="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    setTab("register");
                  }}
                  className="text-[#111] underline hover:opacity-70"
                >
                  Hesap Oluştur
                </Link>
                <Link
                  href="/forgot-password"
                  className="text-[#111] underline hover:opacity-70"
                >
                  Şifrenizi mi Unuttunuz?
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-2xl font-semibold text-[#111] uppercase tracking-wide mb-5">
                Yeni Müşteriler
              </h2>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Adınız*"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-50 border-gray-200 h-12"
                />

                <Input
                  type="email"
                  placeholder="Email Address*"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="bg-gray-50 border-gray-200 h-12"
                />

                <div className="relative">
                  <Input
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Password*"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="bg-gray-50 border-gray-200 h-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                  >
                    {showRegisterPassword ? "Gizle" : "Göster"}
                  </button>
                </div>

                <Button
                  disabled={registerPending}
                  onClick={handleRegister}
                  className="w-full h-12 bg-[#111] text-white hover:bg-[#333] uppercase tracking-wider text-sm font-semibold"
                >
                  {registerPending ? "Kayıt olunuyor..." : "Hesap Oluştur"}
                </Button>
              </div>

              <div className="text-sm pt-3">
                <Link
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    setTab("login");
                  }}
                  className="text-[#111] underline hover:opacity-70"
                >
                  Zaten hesabınız var mı? Giriş Yap
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Taraf - Promosyon Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-100 items-center justify-center px-12 overflow-hidden">
        <div className="flex flex-col items-center justify-center max-w-md text-center">
          <div className="text-xs uppercase tracking-widest mb-3 text-gray-600 font-light">
            TANITIM
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-4 text-black leading-tight">
            BYLT+<br />Rewards
          </h2>
          <p className="text-sm md:text-base text-gray-700 mb-6 font-light leading-relaxed">
            Her alışverişte mağaza kredisi kazanın ve özel ödüllerin kilidini açın.
          </p>
          <Button
            variant="outline"
            className="bg-white text-[#111] hover:bg-gray-50 border-black uppercase tracking-wider text-sm font-light px-8 py-2.5 h-auto rounded-none"
          >
            Daha Fazla Bilgi
          </Button>
        </div>
      </div>

      {/* Mobil Footer */}
      <AuthFooter />
    </div>
  );
}
