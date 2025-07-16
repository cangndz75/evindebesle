"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const steps = [
  {
    number: "01",
    title: "Randevunu Planla",
    description:
      "Evcil dostunuz için uygun tarihi ve hizmet türünü seçerek kolayca randevu oluşturun.",
    image:
      "https://res.cloudinary.com/dlahfchej/image/upload/v1752621182/18_jx1kqp.png",
  },
  {
    number: "02",
    title: "Dogo Pet Uzmanı Kapınızda",
    description:
      "Alanında eğitimli Dogo Pet bakıcımız, belirttiğiniz saatte evinize gelir.",
    image:
      "https://res.cloudinary.com/dlahfchej/image/upload/v1752621180/17_a2tgt3.png",
  },
  {
    number: "03",
    title: "Hizmet Anında Fotoğraf ve Video Desteği",
    description:
      "Mama verme, tuvalet temizliği veya yürüyüş sırasında anlık fotoğraf ve videolarla sizi bilgilendiririz.",
    image:
      "https://plus.unsplash.com/premium_photo-1707353401897-da9ba223f807?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    number: "04",
    title: "Raporlama ve Geri Bildirim",
    description:
      "Hizmet sonrası size özel hazırlanan dijital rapor ile detaylara ulaşır, hizmeti puanlayabilirsiniz.",
    image:
      "https://res.cloudinary.com/dlahfchej/image/upload/v1752619387/13_lmksmp.png",
  },
];

export default function AboutSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="relative w-full h-screen overflow-hidden text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={steps[activeIndex].image}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <Image
            src={steps[activeIndex].image}
            alt={`Adım ${activeIndex + 1}`}
            fill
            className="object-cover brightness-50 transition-all duration-500"
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex justify-center items-center h-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 max-w-7xl w-full px-4">
          {steps.map((step, i) => (
            <div
              key={i}
              onMouseEnter={() => setActiveIndex(i)}
              className={clsx(
                "transition-all duration-300 cursor-pointer p-4 space-y-4",
                i === activeIndex && "bg-white/10 backdrop-blur-sm rounded-lg"
              )}
            >
              <motion.h3 className="text-5xl font-thin">
                {step.number}
              </motion.h3>
              <h4 className="font-semibold text-lg">{step.title}</h4>
              {i === activeIndex && (
                <motion.p
                  className="text-sm opacity-80"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {step.description}
                </motion.p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
