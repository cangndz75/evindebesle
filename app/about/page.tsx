"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import FaqSection from "../(public)/_components/home/FaqSection";
import FooterBanner from "../(public)/_components/FooterBanner";
import Footer from "../(public)/_components/Footer";
import AboutSection from "../(public)/_components/AboutSection";
import Navbar from "../(public)/_components/Navbar";
import Link from "next/link";

const features = [
  "7/24 Destek Hattı",
  "Üst Düzey Hizmet Ortamı",
  "Ekstra Ücret Yok",
  "İşletmeye Özel Yönlendirme",
  "Stratejik İş Analizi",
  "Ücretsiz Danışmanlık",
];

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <section className="w-full bg-gradient-to-br from-white to-slate-100 py-28 text-center px-6">
        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Hakkımızda
        </motion.h1>
        <motion.p
          className="text-gray-600 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Evcil dostlarınıza güvenilir, sevgi dolu ve profesyonel bir bakım
          sunmak için buradayız.
        </motion.p>
      </section>

      <section className="w-full bg-[#0b1523] text-white px-6 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          {/* SOL: Açıklamalar + özellikler */}
          <div>
            <h2 className="text-3xl font-bold mb-6">
              Neden Bizi Tercih Etmelisiniz?
            </h2>
            <p className="text-gray-300 mb-6 text-base leading-relaxed">
              Evcil dostlarınız bizim için sadece birer hayvan değil, ailenizin
              birer parçası. Bu yüzden hizmetlerimizde en yüksek kalite,
              güvenlik ve şeffaflık ilkelerini benimsiyoruz.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-tr from-purple-500 to-indigo-500 text-white"
                >
                  <CheckIcon size={16} />
                </Badge>
                <div>
                  <h4 className="font-semibold">Uzman Bakıcı Kadrosu</h4>
                  <p className="text-sm text-gray-300">
                    Tüm bakıcılarımız detaylı eğitimlerden geçmiş, referanslı ve
                    alanında tecrübelidir.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-tr from-purple-500 to-indigo-500 text-white"
                >
                  <CheckIcon size={16} />
                </Badge>
                <div>
                  <h4 className="font-semibold">Kamera ve Rapor Desteği</h4>
                  <p className="text-sm text-gray-300">
                    Talebinize göre bakım süreci video veya fotoğraflarla
                    belgelenip size iletilir.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-tr from-purple-500 to-indigo-500 text-white"
                >
                  <CheckIcon size={16} />
                </Badge>
                <div>
                  <h4 className="font-semibold">Ekstra Ücret Sürprizi Yok</h4>
                  <p className="text-sm text-gray-300">
                    Hizmet öncesi netleştirilen planlar sayesinde sonradan çıkan
                    gizli ücretlerle karşılaşmazsınız.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg aspect-[9/16] w-full max-w-sm mx-auto">
            <video
              src="https://res.cloudinary.com/dlahfchej/video/upload/v1753710680/VIDEO-2025-07-07-19-18-34_te8en8.mp4"
              controls
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>
      </section>

      <AboutSection />
      <section className="w-full px-6 py-24 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase mb-2">
              BİZ KİMİZ?
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Evcil Dostlarınız İçin Güvenilir ve Sevgi Dolu Bakım
            </h2>
            <p className="text-gray-600 mb-6">
              Evindebesle.com olarak, sevimli dostlarınızın kendi yuvalarında
              konforla ve profesyonelce bakım almasını sağlıyoruz. Sizin
              yokluğunuzda onlar güvende.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                "Eğitimli ve güvenilir bakıcılar",
                "Evde mama, oyun, temizlik ve ilgi",
                "Kamera ve rapor ile hizmet takibi",
                "İstanbul Anadolu Yakası'nda hızlı hizmet",
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckIcon size={16} className="text-green-600 mt-1" />
                  <p className="text-sm">{feature}</p>
                </div>
              ))}
            </div>
            <Link href="/services">
              <Button className="mt-8">Hizmetleri İncele</Button>
            </Link>
          </div>
          <Image
            src="https://res.cloudinary.com/dlahfchej/image/upload/v1752619387/15_iaalt8.png"
            width={600}
            height={500}
            alt="Bakıcı hizmeti"
            className="rounded-lg object-cover"
          />
        </div>
      </section>

      <FaqSection />
      <FooterBanner />
    </div>
  );
}
