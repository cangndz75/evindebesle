"use client";

import { ArrowLeftRight, Gift, Truck, ShieldCheck } from "lucide-react";
import { useState } from "react";

const trustItems = [
  {
    icon: ArrowLeftRight,
    title: "30 GÃ¼n Kolay Ä°ade",
    description: "Ãœcretsiz iade ve deÄŸiÅŸim",
  },
  {
    icon: ShieldCheck,
    title: "Gizli Paketleme",
    description: "Ã–zel ve gÃ¼venli teslimat",
  },
  {
    icon: Truck,
    title: "HÄ±zlÄ± Teslimat",
    description: "2-3 iÅŸ gÃ¼nÃ¼ iÃ§inde",
  },
  {
    icon: ShieldCheck,
    title: "GÃ¼venli Ã–deme",
    description: "256-bit SSL ÅŸifreleme",
  },
];

export default function TrustSection() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter kayÄ±t:", email);
    setEmail("");
  };

  return (
    <section className="w-full bg-[#fafafa]">
      {/* GÃ¼ven UnsurlarÄ± */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <Icon className="w-8 h-8 md:w-10 md:h-10 text-black" />
                </div>
                <h3 className="text-sm md:text-base font-light text-black mb-2">
                  {item.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 font-light">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Newsletter */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-20 text-center border-t border-gray-200">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-black mb-4">
          Yeni Koleksiyonlardan Haberdar Ol
        </h2>
        <p className="text-base md:text-lg text-gray-700 font-light mb-8 max-w-2xl mx-auto">
          Ã–zel kampanyalar, yeni Ã¼rÃ¼nler ve stil Ã¶nerileri iÃ§in e-posta listemize katÄ±lÄ±n.
        </p>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              className="flex-1 px-4 py-3 border border-gray-300 bg-white focus:outline-none focus:border-black transition-colors text-sm font-light placeholder:text-gray-400"
              required
            />
            <button
              type="submit"
              className="px-8 py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-colors text-sm uppercase"
            >
              KatÄ±l
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
