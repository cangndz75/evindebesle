"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function EditorialSection() {
  return (
    <section className="w-full bg-white">
      <div className="grid md:grid-cols-2 min-h-[600px]">
        
        <div className="relative h-[400px] md:h-auto bg-black">
          
        </div>

        
        <div className="bg-[#fafafa] flex items-center p-8 md:p-12 lg:p-16">
          <div className="max-w-lg">
            
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-transparent text-gray-600 text-xs font-light tracking-wider uppercase">
                KOLEKSİYON
              </span>
            </div>

            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-black mb-6 leading-tight">
              The Lace Story
            </h2>

            
            <div className="space-y-4 mb-8">
              <p className="text-base md:text-lg text-gray-700 font-light leading-relaxed">
                Fransız dantellerinin zarafeti ile modern tasarımın buluştuğu özel bir koleksiyon. Her parça, konfor ve estetiği bir araya getiren özenli işçilikle üretilmiştir.
              </p>
              <p className="text-base md:text-lg text-gray-700 font-light leading-relaxed">
                Premium kumaşlar ve görünmez dikişler sayesinde ikinci bir cilt hissi sunan dantel koleksiyonumuz, günlük kullanımda bile size özel hissettiriyor.
              </p>
            </div>

            
            <a
              href="#"
              className="inline-flex items-center gap-2 text-black font-light text-sm md:text-base hover:gap-4 transition-all duration-300 underline underline-offset-4"
            >
              Hikayeyi Oku <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
