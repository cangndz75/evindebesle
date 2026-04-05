"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, getSession } from "next-auth/react";

function AuthFooter() {
  return (
    <footer className="lg:hidden w-full bg-white border-t border-gray-200 py-6 px-6">
      <div className="max-w-md mx-auto">
        <div className="flex flex-col gap-4 text-xs text-gray-600">
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
            <Link href="/privacy" className="hover:text-black transition-colors">
              Gizlilik PolitikasÄ±
            </Link>
            <Link href="/terms" className="hover:text-black transition-colors">
              KullanÄ±m KoÅŸullarÄ±
            </Link>
            <Link href="/contact" className="hover:text-black transition-colors">
              Ä°letiÅŸim
            </Link>
            <Link href="/kvkk" className="hover:text-black transition-colors">
              KVKK
            </Link>
          </div>
          <p className="text-center text-gray-500">
            Â© 2026 Dark Velvet. TÃ¼m haklarÄ± saklÄ±dÄ±r.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function AuthTabs() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerPending, startRegisterTransition] = useTransition();

  const handleLogin = () => {
    startTransition(async () => {
      try {
        console.log('ğŸ” Starting login attempt for:', email);

        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        console.log('âœ… SignIn response:', res);

        if (res?.error) {
          const message =
            res.error === "CredentialsSignin"
              ? "E-posta adresi veya ÅŸifre hatalÄ±."
              : res.error;
          console.error('âŒ Login failed:', res.error);
          toast.error(message);
          return;
        }

        await new Promise((r) => setTimeout(r, 500));

        const session = await getSession();
        console.log('ğŸ‘¤ Session retrieved:', session);

        if (!session) {
          console.error('âŒ No session returned after login');
          toast.error("Oturum alÄ±namadÄ±. LÃ¼tfen tekrar deneyin.");
          return;
        }

        toast.success("GiriÅŸ baÅŸarÄ±lÄ±!");
        const isAdmin = session.user?.isAdmin === true;
        const redirectUrl = isAdmin ? "/dashboard" : "/home";
        console.log('ğŸš€ Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      } catch (error) {
        console.error('ğŸ’¥ Login exception:', error);
        toast.error("GiriÅŸ sÄ±rasÄ±nda bir hata oluÅŸtu. LÃ¼tfen tekrar deneyin.");
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
          toast.error(data.error || "KayÄ±t baÅŸarÄ±sÄ±z.");
          return;
        }

        const otpRes = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: registerEmail }),
        });

        if (!otpRes.ok) {
          toast.error("Kod gÃ¶nderilemedi.");
          return;
        }

        toast.success("KayÄ±t baÅŸarÄ±lÄ±! Kod gÃ¶nderildi.");
        router.push(`/verify?email=${registerEmail}`);
      } catch {
        toast.error("Bir hata oluÅŸtu.");
      }
    });
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-white">
      {/* Mobil: Ãœstte Banner */}


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
              GiriÅŸ Yap
            </button>
            <button
              className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition border-b-2 ${tab === "register"
                ? "text-[#111] border-[#111]"
                : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              onClick={() => setTab("register")}
              type="button"
            >
              Ãœye Ol
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Åifre</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Åifreniz"
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
                      {showPassword ? "Gizle" : "GÃ¶ster"}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full h-12 bg-[#111] text-white hover:bg-[#333] uppercase tracking-wider text-sm font-semibold rounded-none mt-2"
                >
                  {pending ? "GiriÅŸ yapÄ±lÄ±yor..." : "GiriÅŸ Yap"}
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
                  Hesap OluÅŸtur
                </Link>
                <Link
                  href="/forgot-password"
                  className="text-gray-500 hover:text-black transition-colors"
                >
                  Åifrenizi mi Unuttunuz?
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#111] uppercase tracking-wide mb-6">
                Yeni MÃ¼ÅŸteriler
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegister();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">AdÄ±nÄ±z</label>
                  <Input
                    type="text"
                    placeholder="AdÄ±nÄ±z ve SoyadÄ±nÄ±z"
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 ml-1">Åifre</label>
                  <div className="relative">
                    <Input
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="GÃ¼Ã§lÃ¼ Bir Åifre"
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
                      {showRegisterPassword ? "Gizle" : "GÃ¶ster"}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={registerPending}
                  className="w-full h-12 bg-[#111] text-white hover:bg-[#333] uppercase tracking-wider text-sm font-semibold rounded-none mt-2"
                >
                  {registerPending ? "KayÄ±t olunuyor..." : "Hesap OluÅŸtur"}
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
                  Zaten hesabÄ±nÄ±z var mÄ±? <span className="text-[#111] font-semibold underline">GiriÅŸ Yap</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SaÄŸ Taraf - Promosyon Banner */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center px-12 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1604066867775-43f48e3957d8?q=80&w=1170&auto=format&fit=crop')`
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col items-center justify-center max-w-md text-center">
          <div className="text-xs uppercase tracking-[0.3em] mb-4 text-white/80 font-medium">
            HOÅGELDÄ°NÄ°Z
          </div>
          <h2 className="text-6xl md:text-7xl font-bold mb-6 text-white leading-[1.1] tracking-tight">
            DARK<br />VELVET
          </h2>
          <p className="text-base md:text-lg text-white/90 mb-10 font-light leading-relaxed">
            Her alÄ±ÅŸveriÅŸte maÄŸaza kredisi kazanÄ±n ve Ã¶zel Ã¶dÃ¼llerin kilidini aÃ§Ä±n.
          </p>
          <Button
            variant="outline"
            className="bg-white text-[#111] hover:bg-gray-100 border-none uppercase tracking-widest text-sm font-bold px-10 py-3 h-auto rounded-none transition-all hover:scale-105"
          >
            Daha Fazla Bilgi
          </Button>
        </div>
      </div>

      {/* Mobil Footer (Sadece kÃ¼Ã§Ã¼k ekranda) */}
      <AuthFooter />
    </div>
  );
}
