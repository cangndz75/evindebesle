"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Truck, RotateCcw, Star, Smartphone } from "lucide-react";

const footerSections = [
  {
    title: "Mağaza",
    links: [
      { label: "Hikayemiz", href: "/about" },
      { label: "Kumaşlarımız", href: "/fabrics" },
      { label: "Mağazalarımız", href: "/stores" },
      { label: "Atletler & Partnerler", href: "/athletes" },
      { label: "İlk Müdahale", href: "/first-responders" },
      { label: "Dark Velvet+ Ödüller", href: "/rewards" },
    ],
  },
  {
    title: "Nasıl Dark Velvet",
    links: [
      { label: "Sık Sorulan Sorular", href: "/faq" },
      { label: "İade & Değişim", href: "/returns" },
      { label: "İletişim", href: "/contact" },
      { label: "Kariyer", href: "/careers" },
      { label: "Kurumsal Satış", href: "/corporate" },
      { label: "İçerik Üreticisi Ol", href: "/creator" },
    ],
  },
  {
    title: "Destek",
    links: [
      { label: "Kargo Politikaları", href: "/shipping" },
      { label: "İade Politikası", href: "/returns-policy" },
      { label: "Kullanım Koşulları", href: "/terms" },
      { label: "Gizlilik Politikası", href: "/privacy" },
      { label: "Siparişimi Takip Et", href: "/track" },
      { label: "Hediye Kartı Bakiyesi", href: "/gift-card" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { label: "Çerez Politikası", href: "/cookies" },
      { label: "Erişilebilirlik Bildirimi", href: "/accessibility-statement" },
      { label: "Sahte Ürün Bildir", href: "/report-fakes" },
      { label: "Erişilebilirlik", href: "/accessibility" },
      { label: "Kişisel Verilerimi Paylaşma", href: "/do-not-sell" },
    ],
  },
];

const benefits = [
  { icon: "app", text: "Uygulamayı indir, erken erişim kazan" },
  { icon: "medal", text: "Dark Velvet Rewards ile ücretsiz iade" },
  { icon: "clock", text: "30 gün içinde kolay iade" },
  { icon: "truck", text: "999₺ üzeri ücretsiz hızlı kargo" },
];

// İkonlar için özel SVG'ler (resimdeki gibi minimal line art)
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
  }, []);

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
              <div className="flex-shrink-0 w-5 h-5 text-[#111] flex items-center justify-center">
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

        <div className="hidden md:grid grid-cols-5 gap-12">
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
            <form className="flex border border-black">
              <input
                type="email"
                placeholder="E-posta adresin"
                className="flex-1 px-4 py-3 text-sm outline-none"
              />
              <button
                type="submit"
                className="px-6 text-sm tracking-wide uppercase bg-black text-white"
              >
                Gönder
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-black/60">
            © 2026 Dark Velvet. Tüm hakları saklıdır.
          </p>
          <div className="text-xs text-black/60">
            Türkiye (TRY ₺)
          </div>
        </div>
      </div>
    </footer>
  );
}
