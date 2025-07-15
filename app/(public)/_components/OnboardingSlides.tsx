'use client'

import { useState, useEffect } from 'react'

const slides = [
  {
    title: 'Evde Hayvan Bakımı',
    desc: 'Evcil dostlarınıza en iyi bakımı sağlamak için buradayız.',
    image:
      'https://plus.unsplash.com/premium_photo-1664371675057-83f34f7596a2?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Güvenli ve Sevgi Dolu',
    desc: 'Ev ortamında, sevgi dolu bakıcılarla tanışın.',
    image:
      'https://images.unsplash.com/photo-1741942731788-5712579ebb16?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Kolay Erişim',
    desc: 'İhtiyacınız olan hizmetlere tek tıkla ulaşın.',
    image:
      'https://images.unsplash.com/photo-1724331524640-12d4a346e83a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
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
    <div className="relative h-screen w-full flex flex-col items-center justify-center text-center text-white">
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-50"
        style={{ backgroundImage: `url(${slides[index].image})` }}
      />
      <div className="relative max-w-md px-6">
        <h3 className="text-3xl font-bold mb-2">{slides[index].title}</h3>
        <p className="text-lg mb-6">{slides[index].desc}</p>
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i === index ? 'bg-violet-600' : 'bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
