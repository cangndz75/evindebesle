'use client'

import { useState, useEffect } from 'react'

const slides = [
  {
    title: 'Evde Hayvan Bakımı',
    desc: 'Evcil dostlarınıza en iyi bakımı sağlamak için buradayız.',
    // image: '/onboarding1.png',
  },
  {
    title: 'Güvenli ve Sevgi Dolu',
    desc: 'Ev ortamında, sevgi dolu bakıcılarla tanışın.',
    // image: '/onboarding2.png',
  },
  {
    title: 'Kolay Erişim',
    desc: 'İhtiyacınız olan hizmetlere tek tıkla ulaşın.',
    // image: '/onboarding3.png',
  }
]

export default function OnboardingSlides() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-center max-w-md px-6">
      {/* <img src={slides[index].image} alt="" className="mx-auto mb-4" /> */}
      <h3 className="text-xl font-semibold mb-2">{slides[index].title}</h3>
      <p className="text-sm text-muted-foreground">{slides[index].desc}</p>
      <div className="flex justify-center mt-4 gap-2">
        {slides.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === index ? 'bg-violet-600' : 'bg-gray-300'}`} />
        ))}
      </div>
    </div>
  )
}
