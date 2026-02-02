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

          {/* Site Haritası Link & Modal */}
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
                  {/* Alışveriş */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Alışveriş</h5>
                    <ul className="space-y-3">
                      <li><Link href="/men/new" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Yeni Gelenler</Link></li>
                      <li><Link href="/women" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Kadın</Link></li>
                      <li><Link href="/men" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Erkek</Link></li>
                      <li><Link href="/women" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Koleksiyonlar</Link></li>
                      <li><Link href="/category/sale" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">İndirimler</Link></li>
                    </ul>
                  </div>

                  {/* Hesabım */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Hesabım</h5>
                    <ul className="space-y-3">
                      <li><Link href="/auth-tabs" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Giriş Yap</Link></li>
                      <li><Link href="/auth-tabs" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Üye Ol</Link></li>
                      <li><Link href="/profile/personal-info" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Profilim</Link></li>
                      <li><Link href="/profile/orders" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Siparişlerim</Link></li>
                      <li><Link href="/favorites" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Favorilerim</Link></li>
                      <li><Link href="/profile/addresses" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Adreslerim</Link></li>
                    </ul>
                  </div>

                  {/* Destek */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Yardım & Destek</h5>
                    <ul className="space-y-3">
                      <li><Link href="/contact" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">İletişim</Link></li>
                      <li><Link href="/faq" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Sıkça Sorulan Sorular</Link></li>
                      <li><Link href="/track" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Sipariş Takibi</Link></li>
                      <li><Link href="/returns" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">İade & Değişim</Link></li>
                      <li><Link href="/shipping" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Kargo Bilgisi</Link></li>
                      <li><Link href="/sizing" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Beden Rehberi</Link></li>
                    </ul>
                  </div>

                  {/* Kurumsal */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Kurumsal</h5>
                    <ul className="space-y-3">
                      <li><Link href="/about" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Hakkımızda</Link></li>
                      <li><Link href="/about2" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Hikayemiz</Link></li>
                      <li><Link href="/blog" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Blog</Link></li>
                      <li><Link href="/careers" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Kariyer</Link></li>
                      <li><Link href="/stores" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Mağazalarımız</Link></li>
                    </ul>
                  </div>

                  {/* Yasal */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Yasal</h5>
                    <ul className="space-y-3">
                      <li><Link href="/privacy" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Gizlilik Politikası</Link></li>
                      <li><Link href="/terms" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Kullanım Koşulları</Link></li>
                      <li><Link href="/kvkk" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">KVKK</Link></li>
                      <li><Link href="/cookies" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Çerez Politikası</Link></li>
                      <li><Link href="/contract" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Mesafeli Satış Sözleşmesi</Link></li>
                    </ul>
                  </div>

                  {/* Sosyal Medya */}
                  <div className="space-y-4">
                    <h5 className="text-xs uppercase tracking-[0.2em] font-medium text-black border-b border-black/10 pb-2">Sosyal Medya</h5>
                    <ul className="space-y-3">
                      <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Instagram</a></li>
                      <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Facebook</a></li>
                      <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">X (Twitter)</a></li>
                      <li><a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">Pinterest</a></li>
                      <li><a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">YouTube</a></li>
                      <li><a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-sm text-black/60 hover:text-black hover:pl-2 transition-all block">TikTok</a></li>
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
