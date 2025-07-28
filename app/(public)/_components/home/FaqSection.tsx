"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

const faqs = [
  {
    question: "Evde hayvan bakımı nasıl gerçekleşiyor?",
    answer: [
      "Bakıcılarımız, belirttiğiniz gün ve saatlerde adresinize gelir.",
      "Mama, su, oyun, temizlik ve özel isteklerinizi uygular.",
      "İsteğe bağlı olarak kamera ve fotoğraf ile hizmet raporu gönderilir.",
    ],
  },
  {
    question: "Hangi hizmetleri sunuyorsunuz?",
    answer: [
      "Evde besleme, oyun ve sosyalleşme, hijyen/temizlik ve veteriner takibi.",
      "Her hayvana özel planlama yapılır, ekstra ücret sürprizi yoktur.",
    ],
  },
  {
    question: "Bakıcılar güvenilir mi?",
    answer: [
      "Tüm bakıcılarımız referanslı, eğitimli ve detaylı şekilde değerlendirilmiştir.",
      "Sürekli geri bildirim ve kalite kontrol süreci ile güvenliği sağlıyoruz.",
    ],
  },
  {
    question: "Evcil hayvanım özel ilgi gerektiriyor, bunu belirtmeli miyim?",
    answer: [
      "Evet. Tırnak kesim hassasiyeti, ilaç alerjisi gibi tüm özel notlar formda alınır.",
      "Bu bilgiler bakıcınıza önceden iletilir ve hizmet buna göre planlanır.",
    ],
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-gray-50 py-20 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        {/* SOL: FAQ */}
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

        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden shadow-lg aspect-[9/16] w-full max-w-sm mx-auto">
            <video
              src="https://res.cloudinary.com/dlahfchej/video/upload/v1753710168/VIDEO-2025-07-07-19-18-39_wse3zv.mp4"
              controls
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
