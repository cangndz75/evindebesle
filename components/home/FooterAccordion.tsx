"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Truck, RotateCcw, Star, Smartphone, Map, X } from "lucide-react";

const footerSections = [
  {
    title: "Müşteri Hizmetleri",
    links: [
      { label: "Sık Sorulan Sorular", href: "/faq" },
      { label: "İade & Değişim", href: "/returns" },
      { label: "İletişim", href: "/contact" },
      { label: "Siparişimi Takip Et", href: "/track" },
    ],
  },
  {
    title: "Bilgilendirme",
    links: [
      { label: "Kargo Politikaları", href: "/shipping" },
      { label: "Gizlilik Politikası", href: "/privacy" },
      { label: "K.V.K.K. Aydınlatma Metni", href: "/kvkk" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { label: "Hakkımızda", href: "/about" },
      { label: "Blog", href: "/blog" },
    ],
  },
];

const staticBenefits = [
  { icon: "app", text: "Uygulamayı indir, erken erişim kazan" },
  { icon: "medal", text: "Dark Velvet Rewards ile ücretsiz iade" },
  { icon: "clock", text: "30 gün içinde kolay iade" },
];

const AppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="12" height="12" rx="1.5" />
    <path d="M8 4v12M12 4v12" />
  </svg>
);

const MedalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="7" r="3.5" />
    <path d="M10 10.5v4" />
    <path d="M6 14.5l4 2 4-2" />
    <path d="M5 16.5l5-3 5 3" />
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7" />
    <path d="M10 5v5l3 2" />
    <path d="M3 10h1.5" />
    <path d="M15.5 10H17" />
  </svg>
);

const TruckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="11" height="7" rx="0.5" />
    <path d="M13 7h3.5l1.5 2.5v4.5h-5" />
    <circle cx="5.5" cy="16.5" r="1.5" />
    <circle cx="15.5" cy="16.5" r="1.5" />
  </svg>
);

function BenefitMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  const [benefits, setBenefits] = useState(staticBenefits);

  useEffect(() => {
    fetch("/api/company-settings")
      .then((res) => res.json())
      .then((data) => {
        const threshold = data.freeShippingThreshold ?? 999;
        setBenefits([
          ...staticBenefits,
          { icon: "truck", text: `${threshold}₺ üzeri ücretsiz hızlı kargo` },
        ]);
      })
      .catch(() => {
        setBenefits([
          ...staticBenefits,
          { icon: "truck", text: "999₺ üzeri ücretsiz hızlı kargo" },
        ]);
      });
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let x = 0;
    let raf: number;

    const loop = () => {
      x -= 0.4;
      if (Math.abs(x) >= el.scrollWidth / 2) x = 0;
      el.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [benefits]);

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case "app":
        return <AppIcon />;
      case "medal":
        return <MedalIcon />;
      case "clock":
        return <ClockIcon />;
      case "truck":
        return <TruckIcon />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full overflow-hidden border-t border-b border-black/10 bg-white">
      <div
        ref={ref}
        className="flex w-max gap-6 md:gap-16 py-3 md:py-8 px-4 md:px-8 items-center"
      >
        {[...benefits, ...benefits].map((item, i) => {
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 md:gap-3 text-[#111] whitespace-nowrap"
            >
              <div className="shrink-0 w-5 h-5 text-[#111] flex items-center justify-center">
                {renderIcon(item.icon)}
              </div>
              <span className="text-[11px] md:text-sm tracking-wide uppercase font-light text-[#111] leading-tight">
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Footer() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getAccountHref = (href: string) => (session?.user ? href : "/auth-tabs");

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (res.ok) {
        setEmail("");
        import("sonner").then(({ toast }) => toast.success("Bültene başarıyla abone oldunuz!"));
      } else {
        const data = await res.json().catch(() => null);
        import("sonner").then(({ toast }) => toast.error(data?.error || "Abonelik başarısız oldu."));
      }
    } catch {
      import("sonner").then(({ toast }) => toast.error("Bir hata oluştu."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="w-full bg-white">
      <BenefitMarquee />

      <div className="max-w-7xl mx-auto px-5 md:px-10 py-16">
        <div className="md:hidden">
          <Accordion type="single" collapsible className="w-full">
            {footerSections.map((section, i) => (
              <AccordionItem key={i} value={`f-${i}`}>
                <AccordionTrigger className="text-xs uppercase tracking-[0.18em] font-light">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3 pt-3">
                    {section.links.map((l, j) => (
                      <li key={j}>
                        <Link
                          href={l.href}
                          className="text-sm text-black/70 hover:text-black transition-colors"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="hidden md:grid grid-cols-4 gap-12">
          {footerSections.map((section, i) => (
            <div key={i}>
              <h3 className="text-xs uppercase tracking-[0.18em] font-light mb-5">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((l, j) => (
                  <li key={j}>
                    <Link
                      href={l.href}
                      className="text-sm text-black/70 hover:text-black transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-xs uppercase tracking-[0.18em] font-light mb-5">
              %20’ye Varan İndirim
            </h3>
            <p className="text-sm text-black/70 mb-4">
              Dark Velvet ayrıcalıkları için bültene katıl
            </p>
            <form onSubmit={handleSubscribe} className="flex border border-black">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresin"
                className="flex-1 px-4 py-3 text-sm outline-none"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 text-sm tracking-wide uppercase bg-black text-white"
              >
                {isSubmitting ? "Gönderiliyor" : "Gönder"}
              </button>
            </form>
            <div className="mt-4 flex flex-col gap-3 items-end">
              <img
                src="/logo_band_colored@2x.png"
                alt="Ödeme yöntemleri"
                className="h-6 w-auto object-contain"
              />
              <img
                src="/iyzico_ile_ode_colored_horizontal.png"
                alt="iyzico ile öde"
                className="h-5 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-black/60">
            © 2026 Dark Velvet. Tüm hakları saklıdır.
          </p>

          
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 text-xs text-black/60 hover:text-black transition-colors group">
                <Map className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="uppercase tracking-[0.15em]">Site Haritası</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white p-0">
              <DialogHeader className="sticky top-0 bg-white z-10 px-8 py-6 border-b border-black/10">
                <DialogTitle className="text-xl font-light uppercase tracking-[0.2em] text-center">
                  Site Haritası
                </DialogTitle>
              </DialogHeader>

              <div className="px-8 py-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Alışveriş</h5>
                    <ul className="space-y-3">
                      <li><Link href="/new-arrivals" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Yeni Gelenler</Link></li>
                      <li><Link href="/women" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Kadın</Link></li>
                      <li><Link href="/men" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Erkek</Link></li>
                      <li><Link href="/collections" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Koleksiyonlar</Link></li>
                    </ul>
                  </div>

                  
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Hesabım</h5>
                    <ul className="space-y-3">
                      <li><Link href="/auth-tabs" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Giriş Yap</Link></li>
                      <li><Link href="/auth-tabs" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Üye Ol</Link></li>
                      <li><Link href={getAccountHref("/profile/personal-info")} className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Profilim</Link></li>
                      <li><Link href={getAccountHref("/profile/orders")} className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Siparişlerim</Link></li>
                      <li><Link href={getAccountHref("/favorites")} className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Favorilerim</Link></li>
                      <li><Link href={getAccountHref("/profile/addresses")} className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Adreslerim</Link></li>
                    </ul>
                  </div>

                  
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Müşteri Hizmetleri</h5>
                    <ul className="space-y-3">
                      <li><Link href="/faq" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Sık Sorulan Sorular</Link></li>
                      <li><Link href="/returns" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">İade & Değişim</Link></li>
                      <li><Link href="/contact" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">İletişim</Link></li>
                      <li><Link href="/track" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Siparişimi Takip Et</Link></li>
                    </ul>
                  </div>

                  
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Bilgilendirme</h5>
                    <ul className="space-y-3">
                      <li><Link href="/shipping" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Kargo Politikaları</Link></li>
                      <li><Link href="/privacy" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Gizlilik Politikası</Link></li>
                      <li><Link href="/kvkk" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">K.V.K.K. Aydınlatma Metni</Link></li>
                    </ul>
                  </div>

                  
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Kurumsal</h5>
                    <ul className="space-y-3">
                      <li><Link href="/about" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Hakkımızda</Link></li>
                      <li><Link href="/blog" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Blog</Link></li>
                    </ul>
                  </div>

                  
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Sosyal Medya</h5>
                    <ul className="space-y-3">
                      <li><a href="https://www.instagram.com/darkvelvet0/" target="_blank" rel="noopener noreferrer" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Instagram</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-xs text-black/60">
            Türkiye (TRY ₺)
          </div>
        </div>
      </div>
    </footer>
  );
}
