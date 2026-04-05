"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
    title: "MÃ¼ÅŸteri Hizmetleri",
    links: [
      { label: "SÄ±k Sorulan Sorular", href: "/faq" },
      { label: "Ä°ade & DeÄŸiÅŸim", href: "/returns" },
      { label: "Ä°letiÅŸim", href: "/contact" },
      { label: "SipariÅŸimi Takip Et", href: "/track" },
    ],
  },
  {
    title: "Bilgilendirme",
    links: [
      { label: "Kargo PolitikalarÄ±", href: "/shipping" },
      { label: "Gizlilik PolitikasÄ±", href: "/privacy" },
      { label: "K.V.K.K. AydÄ±nlatma Metni", href: "/kvkk" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { label: "HakkÄ±mÄ±zda", href: "/about" },
      { label: "Blog", href: "/blog" },
    ],
  },
];

const staticBenefits = [
  { icon: "app", text: "UygulamayÄ± indir, erken eriÅŸim kazan" },
  { icon: "medal", text: "Dark Velvet Rewards ile Ã¼cretsiz iade" },
  { icon: "clock", text: "30 gÃ¼n iÃ§inde kolay iade" },
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
          { icon: "truck", text: `${threshold}â‚º Ã¼zeri Ã¼cretsiz hÄ±zlÄ± kargo` },
        ]);
      })
      .catch(() => {
        setBenefits([
          ...staticBenefits,
          { icon: "truck", text: "999â‚º Ã¼zeri Ã¼cretsiz hÄ±zlÄ± kargo" },
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
              %20â€™ye Varan Ä°ndirim
            </h3>
            <p className="text-sm text-black/70 mb-4">
              Dark Velvet ayrÄ±calÄ±klarÄ± iÃ§in bÃ¼ltene katÄ±l
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
                GÃ¶nder
              </button>
            </form>
            <div className="mt-4 flex flex-col gap-3 items-end">
              <img
                src="/logo_band_colored@2x.png"
                alt="Ã–deme yÃ¶ntemleri"
                className="h-6 w-auto object-contain"
              />
              <img
                src="/iyzico_ile_ode_colored_horizontal.png"
                alt="iyzico ile Ã¶de"
                className="h-5 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-black/60">
            Â© 2026 Dark Velvet. TÃ¼m haklarÄ± saklÄ±dÄ±r.
          </p>

          {/* Site HaritasÄ± Link & Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 text-xs text-black/60 hover:text-black transition-colors group">
                <Map className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="uppercase tracking-[0.15em]">Site HaritasÄ±</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white p-0">
              <DialogHeader className="sticky top-0 bg-white z-10 px-8 py-6 border-b border-black/10">
                <DialogTitle className="text-xl font-light uppercase tracking-[0.2em] text-center">
                  Site HaritasÄ±
                </DialogTitle>
              </DialogHeader>

              <div className="px-8 py-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {/* AlÄ±ÅŸveriÅŸ */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">AlÄ±ÅŸveriÅŸ</h5>
                    <ul className="space-y-3">
                      <li><Link href="/men/new" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Yeni Gelenler</Link></li>
                      <li><Link href="/women" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">KadÄ±n</Link></li>
                      <li><Link href="/men" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Erkek</Link></li>
                      <li><Link href="/women" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Koleksiyonlar</Link></li>
                      <li><Link href="/category/sale" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Ä°ndirimler</Link></li>
                    </ul>
                  </div>

                  {/* HesabÄ±m */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">HesabÄ±m</h5>
                    <ul className="space-y-3">
                      <li><Link href="/auth-tabs" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">GiriÅŸ Yap</Link></li>
                      <li><Link href="/auth-tabs" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Ãœye Ol</Link></li>
                      <li><Link href="/profile/personal-info" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Profilim</Link></li>
                      <li><Link href="/profile/orders" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">SipariÅŸlerim</Link></li>
                      <li><Link href="/favorites" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Favorilerim</Link></li>
                      <li><Link href="/profile/addresses" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Adreslerim</Link></li>
                    </ul>
                  </div>

                  {/* MÃ¼ÅŸteri Hizmetleri */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">MÃ¼ÅŸteri Hizmetleri</h5>
                    <ul className="space-y-3">
                      <li><Link href="/faq" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">SÄ±k Sorulan Sorular</Link></li>
                      <li><Link href="/returns" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Ä°ade & DeÄŸiÅŸim</Link></li>
                      <li><Link href="/contact" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Ä°letiÅŸim</Link></li>
                      <li><Link href="/track" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">SipariÅŸimi Takip Et</Link></li>
                    </ul>
                  </div>

                  {/* Bilgilendirme */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Bilgilendirme</h5>
                    <ul className="space-y-3">
                      <li><Link href="/shipping" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Kargo PolitikalarÄ±</Link></li>
                      <li><Link href="/privacy" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Gizlilik PolitikasÄ±</Link></li>
                      <li><Link href="/kvkk" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">K.V.K.K. AydÄ±nlatma Metni</Link></li>
                    </ul>
                  </div>

                  {/* Kurumsal */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Kurumsal</h5>
                    <ul className="space-y-3">
                      <li><Link href="/about" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">HakkÄ±mÄ±zda</Link></li>
                      <li><Link href="/blog" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Blog</Link></li>
                    </ul>
                  </div>

                  {/* Sosyal Medya */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Sosyal Medya</h5>
                    <ul className="space-y-3">
                      <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Instagram</a></li>
                      <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Facebook</a></li>
                      <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">X (Twitter)</a></li>
                      <li><a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">TikTok</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-xs text-black/60">
            TÃ¼rkiye (TRY â‚º)
          </div>
        </div>
      </div>
    </footer>
  );
}
