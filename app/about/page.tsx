'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckIcon } from 'lucide-react'
import FaqSection from '../(public)/_components/home/FaqSection'
import FooterBanner from '../(public)/_components/FooterBanner'
import Footer from '../(public)/_components/Footer'
import AboutSection from '../(public)/_components/AboutSection'
import Navbar from '../(public)/_components/Navbar'

const features = [
  '7/24 Destek Hattı',
  'Üst Düzey Hizmet Ortamı',
  'Ekstra Ücret Yok',
  'İşletmeye Özel Yönlendirme',
  'Stratejik İş Analizi',
  'Ücretsiz Danışmanlık',
]

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Navbar />
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
          Evcil dostlarınıza güvenilir, sevgi dolu ve profesyonel bir bakım sunmak için buradayız.
        </motion.p>
      </section>

      <section className="w-full bg-[#0b1523] text-white px-6 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Yaratıcı fikirlerle <br /> evcil bakımını yeniden tanımlıyoruz
            </h2>
            <div className="space-y-6 mt-6">
              <div className="flex items-start gap-4">
                <Badge variant="secondary" className="bg-gradient-to-tr from-purple-500 to-indigo-500 text-white">
                  <CheckIcon size={16} />
                </Badge>
                <div>
                  <h4 className="font-semibold">Profesyonel Hizmet</h4>
                  <p className="text-sm text-gray-300">Alanında uzman bakıcılarımızla evcil dostlarınız emin ellerde.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Badge variant="secondary" className="bg-gradient-to-tr from-purple-500 to-indigo-500 text-white">
                  <CheckIcon size={16} />
                </Badge>
                <div>
                  <h4 className="font-semibold">Çözüm Odaklı Yaklaşım</h4>
                  <p className="text-sm text-gray-300">Her ihtiyaca özel çözümlerle en iyi deneyimi sunuyoruz.</p>
                </div>
              </div>
            </div>
          </div>
          <Image
            src="/images/about1.png"
            alt="Hakkımızda"
            width={600}
            height={400}
            className="rounded-lg object-cover"
          />
        </div>
      </section>

      <AboutSection />
      <section className="w-full px-6 py-24 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase mb-2">BİZ KİMİZ?</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Vizyonunuzu Gerçeğe Dönüştürmek İçin Yanınızdayız
            </h2>
            <p className="text-gray-600 mb-6">
              Evcil hayvan bakımı konusunda güven, konfor ve uzmanlığı bir araya getiriyoruz. Her adımda sizinleyiz.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckIcon size={16} className="text-green-600 mt-1" />
                  <p className="text-sm">{feature}</p>
                </div>
              ))}
            </div>
            <Button className="mt-8">Daha Fazlasını Keşfet</Button>
          </div>
          <Image
            src="/activities.jpg"
            width={600}
            height={500}
            alt="Ekibimiz"
            className="rounded-lg object-cover"
          />
        </div>
      </section>

      <FaqSection />
      <FooterBanner />
      <Footer />
    </div>
  )
}
