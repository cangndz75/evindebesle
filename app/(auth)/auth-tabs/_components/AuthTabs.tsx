"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn, getSession } from "next-auth/react";
import { getZodErrorMessage, PASSWORD_POLICY_HINT, registerSchema } from "@/lib/validation/auth";
import LegalDocumentModal, {
  LegalTextLink,
  type LegalDocumentType,
} from "@/components/legal/LegalDocumentModal";

function AuthFooter({
  onOpenLegal,
}: {
  onOpenLegal: (type: LegalDocumentType) => void;
}) {
  return (
    <footer className="lg:hidden w-full bg-white border-t border-gray-200 py-6 px-6">
      <div className="max-w-md mx-auto">
        <div className="flex flex-col gap-4 text-xs text-gray-600">
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
            <button
              type="button"
              onClick={() => onOpenLegal("privacy")}
              className="hover:text-black transition-colors underline-offset-2 hover:underline"
            >
              Gizlilik Politikası
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal("terms")}
              className="hover:text-black transition-colors underline-offset-2 hover:underline"
            >
              Kullanım Koşulları
            </button>
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerPending, startRegisterTransition] = useTransition();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalDocumentType | null>(null);

  const handleLogin = () => {
    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (res?.error) {
          let message = "E-posta adresi veya şifre hatalı.";
          if (res.error !== "CredentialsSignin") {
            message = res.error;
          }
          toast.error(message);
          return;
        }

        await new Promise((r) => setTimeout(r, 500));

        const session = await getSession();

        if (!session) {
          toast.error("Oturum alınamadı. Lütfen tekrar deneyin.");
          return;
        }

        toast.success("Giriş başarılı!");
        const isAdmin = session.user?.isAdmin === true;
        const mfaPending = session.user?.mfaPending === true;
        const redirectUrl = isAdmin && mfaPending ? "/mfa-verify" : isAdmin ? "/dashboard" : "/home";
        window.location.href = redirectUrl;
      } catch {
        toast.error("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      }
    });
  };

  const handleRegister = () => {
    if (!acceptedTerms) {
      toast.error("Kullanım koşullarını ve gizlilik politikasını kabul etmelisiniz.");
      return;
    }

    startRegisterTransition(async () => {
      try {
        const validated = registerSchema.safeParse({
          name,
          email: registerEmail,
          password: registerPassword,
        });
        if (!validated.success) {
          toast.error(getZodErrorMessage(validated.error));
          return;
        }

        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validated.data),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Kayıt başarısız.");
          return;
        }

        sessionStorage.setItem(
          "pendingRegisterAuth",
          JSON.stringify({
            email: validated.data.email,
            password: validated.data.password,
          })
        );

        if (data.verificationEmailSent === false) {
          toast.warning(
            "Hesap oluşturuldu ancak doğrulama e-postası gönderilemedi. Doğrulama sayfasından kodu tekrar isteyin."
          );
        } else {
          toast.success("Kayıt başarılı! E-postanıza doğrulama kodu gönderildi.");
        }
        router.push(`/verify?email=${encodeURIComponent(validated.data.email)}`);
      } catch {
        toast.error("Bir hata oluştu.");
      }
    });
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-white">
      


      
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 sm:px-8 md:px-12 py-8 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          
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
                Yeni Bir Hesap Oluşturun
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
                  <p className="text-xs text-gray-500 leading-relaxed">{PASSWORD_POLICY_HINT}</p>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <Checkbox
                    id="register-terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) =>
                      setAcceptedTerms(checked === true)
                    }
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="register-terms"
                    className="text-xs leading-relaxed text-gray-600 cursor-pointer select-none"
                  >
                    <LegalTextLink
                      type="terms"
                      onOpen={setLegalModal}
                    >
                      Kullanım Koşullarını
                    </LegalTextLink>{" "}
                    ve{" "}
                    <LegalTextLink
                      type="privacy"
                      onOpen={setLegalModal}
                    >
                      Gizlilik Politikasını
                    </LegalTextLink>{" "}
                    okuduğumu ve kabul ettiğimi onaylıyorum.
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={registerPending || !acceptedTerms}
                  className="w-full h-12 bg-[#111] text-white hover:bg-[#333] uppercase tracking-wider text-sm font-semibold rounded-none mt-2"
                >
                  {registerPending ? "Kayıt olunuyor..." : "Hesap Oluştur"}
                </Button>
              </form>

              <div className="text-xs pt-4 border-t border-gray-100 uppercase tracking-wide text-center">
                <Link
                  href="/auth-tabs"
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
            En sevdiğiniz ürünleri keşfedin, alışverişin keyfini çıkarın. Hemen üye olun ve özel fırsatları kaçırmayın!
          </p>
          <Button
            variant="outline"
            className="bg-white text-[#111] hover:bg-gray-100 border-none uppercase tracking-widest text-sm font-bold px-10 py-3 h-auto rounded-none transition-all hover:scale-105"
          >
            Daha Fazla Bilgi
          </Button>
        </div>
      </div>

      
      <AuthFooter onOpenLegal={setLegalModal} />
      <LegalDocumentModal
        type={legalModal}
        onClose={() => setLegalModal(null)}
      />
    </div>
  );
}
