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
      try {
        console.log('🔐 Starting login attempt for:', email);

        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        console.log('✅ SignIn response:', res);

        if (res?.error) {
          const message =
            res.error === "CredentialsSignin"
              ? "E-posta adresi veya şifre hatalı."
              : res.error;
          console.error('❌ Login failed:', res.error);
          toast.error(message);
          return;
        }

        await new Promise((r) => setTimeout(r, 500));

        const session = await getSession();
        console.log('👤 Session retrieved:', session);

        if (!session) {
          console.error('❌ No session returned after login');
          toast.error("Oturum alınamadı. Lütfen tekrar deneyin.");
          return;
        }

        toast.success("Giriş başarılı!");
        const isAdmin = session.user?.isAdmin === true;
        const redirectUrl = isAdmin ? "/dashboard" : "/home";
        console.log('🚀 Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      } catch (error) {
        console.error('💥 Login exception:', error);
        toast.error("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      }
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
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-white">
      {/* Mobil: Üstte Banner */}


      {/* Sol Taraf - Login/Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 sm:px-8 md:px-12 py-8 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Tablar */}
          <div className="flex mb-8 gap-2">
            <button
              className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition border-b-2 ${tab === "login"
                ? "text-[#111] border-[#111]"
                : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              onClick={() => setTab("login")}
              type="button"
            >
              Giriş Yap
            </button>
            <button
              className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition border-b-2 ${tab === "register"
                ? "text-[#111] border-[#111]"
                : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              onClick={() => setTab("register")}
              type="button"
            >
              Üye Ol
            </button>
          </div>

          {tab === "login" ? (
            <div className="space-y-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Email</label>
                  <Input
                    type="email"
                    placeholder="Email Adresiniz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-50 border-gray-200 h-12 rounded-none focus-visible:ring-1 focus-visible:ring-gray-400"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Şifre</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Şifreniz"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-50 border-gray-200 h-12 rounded-none focus-visible:ring-1 focus-visible:ring-gray-400"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-gray-600 uppercase tracking-tighter"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? "Gizle" : "Göster"}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full h-12 bg-[#111] text-white hover:bg-[#333] uppercase tracking-wider text-sm font-semibold rounded-none mt-2"
                >
                  {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </form>

              <div className="flex items-center justify-between text-xs pt-4 border-t border-gray-100 uppercase tracking-wide">
                <Link
                  href="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    setTab("register");
                  }}
                  className="text-[#111] font-semibold hover:opacity-70 transition-opacity"
                >
                  Hesap Oluştur
                </Link>
                <Link
                  href="/forgot-password"
                  className="text-gray-500 hover:text-black transition-colors"
                >
                  Şifrenizi mi Unuttunuz?
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#111] uppercase tracking-wide mb-6">
                Yeni Müşteriler
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegister();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Adınız</label>
                  <Input
                    type="text"
                    placeholder="Adınız ve Soyadınız"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-50 border-gray-200 h-12 rounded-none focus-visible:ring-1 focus-visible:ring-gray-400"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Email</label>
                  <Input
                    type="email"
                    placeholder="Email Adresiniz"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="bg-gray-50 border-gray-200 h-12 rounded-none focus-visible:ring-1 focus-visible:ring-gray-400"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Şifre</label>
                  <div className="relative">
                    <Input
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="Güçlü Bir Şifre"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="bg-gray-50 border-gray-200 h-12 rounded-none focus-visible:ring-1 focus-visible:ring-gray-400"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-gray-600 uppercase tracking-tighter"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                    >
                      {showRegisterPassword ? "Gizle" : "Göster"}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={registerPending}
                  className="w-full h-12 bg-[#111] text-white hover:bg-[#333] uppercase tracking-wider text-sm font-semibold rounded-none mt-2"
                >
                  {registerPending ? "Kayıt olunuyor..." : "Hesap Oluştur"}
                </Button>
              </form>

              <div className="text-xs pt-4 border-t border-gray-100 uppercase tracking-wide text-center">
                <Link
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    setTab("login");
                  }}
                  className="text-gray-500 hover:text-black transition-colors"
                >
                  Zaten hesabınız var mı? <span className="text-[#111] font-semibold underline">Giriş Yap</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Taraf - Promosyon Banner */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center px-12 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1604066867775-43f48e3957d8?q=80&w=1170&auto=format&fit=crop')`
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col items-center justify-center max-w-md text-center">
          <div className="text-xs uppercase tracking-[0.3em] mb-4 text-white/80 font-medium">
            HOŞGELDİNİZ
          </div>
          <h2 className="text-6xl md:text-7xl font-bold mb-6 text-white leading-[1.1] tracking-tight">
            DARK<br />VELVET
          </h2>
          <p className="text-base md:text-lg text-white/90 mb-10 font-light leading-relaxed">
            Her alışverişte mağaza kredisi kazanın ve özel ödüllerin kilidini açın.
          </p>
          <Button
            variant="outline"
            className="bg-white text-[#111] hover:bg-gray-100 border-none uppercase tracking-widest text-sm font-bold px-10 py-3 h-auto rounded-none transition-all hover:scale-105"
          >
            Daha Fazla Bilgi
          </Button>
        </div>
      </div>

      {/* Mobil Footer (Sadece küçük ekranda) */}
      <AuthFooter />
    </div>
  );
}
