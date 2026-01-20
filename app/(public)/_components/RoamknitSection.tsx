"use client";

import Image from "next/image";

export default function RoamknitSection() {
  return (
    <section className="w-full bg-[#f5f1eb] py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Sol - Model */}
          <div className="md:col-span-2 relative h-[500px] md:h-[600px] overflow-hidden group">
            <Image
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1000&auto=format&fit=crop"
              alt="Model"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 66vw"
            />
          </div>

          {/* Sağ - Üst Panel */}
          <div className="space-y-6 md:space-y-8">
            <div className="relative h-[240px] md:h-[290px] overflow-hidden group">
              <Image
                src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=500&auto=format&fit=crop"
                alt="Sweatshirts"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-white/90 text-sm font-light mb-2 uppercase tracking-wider">
                  Stil ve Konforla Rahatlayın
                </p>
                <h3 className="text-3xl md:text-4xl text-white font-light mb-4">
                  Roamknit Koleksiyonu
                </h3>
                <button className="px-8 py-3 bg-black text-white text-sm font-light tracking-wide hover:bg-gray-800 transition-colors uppercase">
                  Şimdi Alışveriş Yap
                </button>
              </div>
            </div>

            {/* Alt Panel - Boş */}
            <div className="h-[240px] md:h-[290px] bg-[#f5f1eb]" />
          </div>
        </div>
      </div>
    </section>
  );
}
