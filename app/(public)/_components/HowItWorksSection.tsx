"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Rocket, Paintbrush, Code } from "lucide-react";
import { PawPrint, Users, ShieldCheck } from "lucide-react";

const features = [
  {
    step: "Adım 1",
    title: "Talebini Oluştur",
    content:
      "Evcil hayvanın için bakım, konaklama ya da gezdirme ihtiyacını seçerek birkaç saniyede talep oluştur.",
    icon: PawPrint,
    image:
      "https://res.cloudinary.com/dlahfchej/image/upload/v1752619388/8_kkoxpr.png",
  },
  {
    step: "Adım 2",
    title: "Hizmet Durumunu Kontrol Et",
    content:
      "Bakıcın talebini onayladıktan sonra, hizmet tarihini ve detaylarını kontrol et. İstersen bakıcı ile iletişime geç.",
    icon: Users,
    image:
      "https://res.cloudinary.com/dlahfchej/image/upload/v1752619158/1_x7as6v.png",
  },
  {
    step: "Adım 3",
    title: "Evcil Dostun Güvende",
    content:
      "Bakıcın evcil hayvanına özenle bakar. Sen de dilediğin zaman fotoğraf ve gelişmeleri takip edebilirsin.",
    icon: ShieldCheck,
    image:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=2070&auto=format&fit=crop",
  },
];

export default function HowItWorksSection() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [progress, setProgress] = useState(0);
  const autoSlide = true;

  useEffect(() => {
    if (!autoSlide) return;

    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / (4000 / 100));
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [progress]);

  return (
    <div className="relative z-10 p-8 md:p-12">
      <div
        className="absolute inset-0 -z-10 mx-auto h-56 w-1/2 rounded-full blur-[100px] opacity-30"
        style={{
          background:
            "radial-gradient(circle at center, rgba(192,15,102,0.5), transparent)",
        }}
      />

      <div className="mx-auto w-full max-w-7xl">
        {/* Headline */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-4xl font-bold md:text-5xl">Nasıl Çalışır?</h2>
          <p className="mt-3 text-muted-foreground">
            Evcil hayvanın için en iyi bakımı sağlamak çok kolay!
          </p>
        </div>

        <hr className="mx-auto mb-10 h-px w-1/2 bg-foreground/20" />

        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-10">
          {/* Left side steps */}
          <div className="order-2 space-y-6 md:order-1">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === currentFeature;

              return (
                <motion.button
                  key={index}
                  onClick={() => {
                    setCurrentFeature(index);
                    setProgress(0);
                  }}
                  className="flex w-full items-start gap-4 text-left"
                  initial={{ opacity: 0.3, x: -20 }}
                  animate={{
                    opacity: isActive ? 1 : 0.3,
                    x: 0,
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isActive
                        ? "border-primary bg-primary/10 text-primary shadow-md"
                        : "border-muted-foreground bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "text-xl font-semibold",
                        isActive ? "text-primary" : ""
                      )}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.content}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Right side image */}
          <div className="relative order-1 h-[200px] md:order-2 md:h-[300px] lg:h-[400px] overflow-hidden rounded-xl border border-primary/20 shadow-xl">
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="absolute inset-0"
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -100, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 rounded-md bg-background/80 px-2 py-1 text-xs font-medium text-primary backdrop-blur-sm shadow">
                        {feature.step}
                      </div>
                    </motion.div>
                  )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
