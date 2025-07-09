"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import mainImage from "@/public/w1.png";
import extra1 from "@/public/w1.png";
import extra2 from "@/public/w1.png";

const faqs = [
  {
    question: "Evcil hayvanımı nasıl eğitirim?",
    answer: [
      "Sabırlı ve tutarlı olun.",
      "Ödül temelli eğitim yöntemlerini tercih edin.",
      "Günlük kısa seanslarla başlayın.",
      "Olumlu pekiştirme kullanın.",
      "Profesyonel destek almaktan çekinmeyin.",
    ],
  },
  {
    question: "Evcil hayvanımı nasıl yönetebilirim?",
    answer: [
      "Günlük rutin oluşturun.",
      "Sağlıklı mama tercih edin.",
      "Veteriner kontrollerini aksatmayın.",
    ],
  },
  {
    question: "Evcil hayvanım için en iyi bakım nedir?",
    answer: [
      "Tüy bakımı ve tırnak kesimi düzenli yapılmalı.",
      "Temiz su her zaman erişilebilir olmalı.",
      "Zihinsel ve fiziksel aktiviteler önemli.",
    ],
  },
  {
    question: "Bakıcı olmak için ne gereklidir?",
    answer: [
      "Hayvan sevgisi ve sabır şarttır.",
      "Deneyim veya referans faydalıdır.",
      "Zamanında iletişim kurabilme önemlidir.",
    ],
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-gray-50 py-20 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        {/* FAQ */}
        <div>
          <h2 className="text-4xl font-bold mb-4">Sıkça Sorulan Sorular</h2>
          <p className="text-gray-600 mb-8">
            Evcil dostlarınızla ilgili aklınıza takılan soruları yanıtladık.
          </p>
          <div className="space-y-4">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-xl border transition-all duration-300 ${
                    isOpen ? "bg-white shadow-md scale-[1.01]" : "bg-gray-100"
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left text-lg font-medium text-gray-900"
                  >
                    {item.question}
                    {isOpen ? (
                      <ChevronUp size={22} />
                    ) : (
                      <ChevronDown size={22} />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-0 text-gray-700 space-y-2 text-base">
                      {item.answer.map((line, i) => (
                        <p key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 font-semibold">
                            {i + 1}.
                          </span>{" "}
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Görseller */}
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden shadow-lg">
            <Image
              src={mainImage}
              alt="Evcil Hayvan Görseli"
              className="w-full h-auto object-cover rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Image
              src={extra1}
              alt="Ek Görsel 1"
              className="w-full aspect-square object-cover rounded-xl shadow-md"
            />
            <Image
              src={extra2}
              alt="Ek Görsel 2"
              className="w-full aspect-square object-cover rounded-xl shadow-md"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
