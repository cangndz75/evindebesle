import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Koleksiyonlar | Dark Velvet",
  description: "Her koleksiyon, kendine özgü bir hikaye anlatır. Doku, siluet ve ruh halinin kusursuz uyumu.",
};

export const revalidate = 3600;
export const dynamic = "force-dynamic";

async function getCollections() {
  try {
    const items = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        image1: true,
        image2: true,
        createdAt: true,
      }
    });
    return items;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="w-full bg-white text-[#111] font-sans overflow-x-hidden">
      {/* 1. HERO SECTION (Black Background) */}
      <section className="relative w-full h-[85vh] min-h-[600px] bg-black flex flex-col items-center justify-center text-center px-6 overflow-hidden pt-20">
        <div className="z-10 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="text-[10px] md:text-xs tracking-[0.5em] uppercase text-white/60 mb-6 block font-light">
            YENİ SEZON
          </span>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extralight text-white tracking-tighter mb-8 leading-tight">
            Koleksiyonlar
          </h1>
          <p className="text-sm md:text-lg text-white/70 max-w-2xl mx-auto font-light leading-relaxed mb-12">
            Her koleksiyon, kendine özgü bir hikaye anlatır. Doku, siluet ve ruh halinin kusursuz uyumu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="#koleksiyonlar"
              className="bg-white text-black px-10 py-4 text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-white/90 transition-all duration-300"
            >
              KOLEKSİYONU KEŞFET
            </Link>
            <Link 
              href="/collections/all"
              className="border border-white/30 text-white px-10 py-4 text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-white hover:text-black transition-all duration-300"
            >
              TÜM KOLEKSİYONLAR
            </Link>
          </div>
        </div>
        {/* Subtle decorative elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px]"></div>
        </div>
      </section>

      {/* 2. MIDDLE TEXT SECTION (White Background) */}
      <section className="py-24 md:py-40 px-6 max-w-7xl mx-auto text-center border-b border-gray-100">
        <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-gray-400 mb-6 block font-bold">
          KURGULANMIŞ HİKAYELER
        </span>
        <h2 className="text-4xl md:text-6xl font-serif font-extralight tracking-tight text-black mb-10 italic">
          Her koleksiyon, bir ruh hali
        </h2>
        <p className="text-base md:text-lg text-gray-500 max-w-3xl mx-auto font-light leading-relaxed">
           DARK VELVET'in her koleksiyonu, özgün bir estetik dil konuşur. Kumaş, kesim ve atmosferin 
           özenle tasarlandığı dünyalara adım atın. Her parça, kendine ait bir hikaye anlatır.
        </p>
      </section>

      {/* 3. COLLECTIONS LIST */}
      <section id="koleksiyonlar" className="w-full">
        {collections.length === 0 ? (
          <div className="text-center py-40 text-gray-400 font-light italic">Mevcut aktif koleksiyon bulunmuyor.</div>
        ) : (
          <div className="space-y-0">
            {collections.map((collection: any, idx: number) => {
              const itemNumber = (idx + 1).toString().padStart(2, '0');
              const isEven = idx % 2 === 0;
              const year = collection.createdAt.getFullYear();
              
              // Dummy data for "Ruh" and "Malzeme" if not matched by specific titles
              let ruh = "Zarif & Modern";
              let malzeme = "Premium Kumaş";
              
              if (collection.title.toLowerCase().includes("midnight")) {
                ruh = "Romantik & Zarif";
                malzeme = "Fransız Dantel";
              } else if (collection.title.toLowerCase().includes("satin")) {
                ruh = "Cesur & Modern";
                malzeme = "İpek Saten";
              }

              return (
                <div key={collection.id} className="py-24 md:py-40 border-b border-gray-100 last:border-b-0">
                  <div className={`max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center gap-16 md:gap-24 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                    
                    {/* Content Column */}
                    <div className="w-full lg:w-1/2 space-y-10 group">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                           <span className="text-6xl md:text-8xl font-serif font-extralight text-black/10 select-none">
                             {itemNumber}
                           </span>
                        </div>
                        <h3 className="text-5xl md:text-7xl font-serif font-extralight tracking-tighter text-black leading-tight">
                          {collection.title}
                        </h3>
                      </div>


                      <p className="text-base text-gray-500 font-light leading-relaxed max-w-md">
                        {collection.description || `${collection.title} koleksiyonu, her detayıyla zarafeti ve modernliği simgeliyor.`}
                      </p>

                      <div className="pt-6">
                        <Link 
                          href={`/collections/${collection.slug}`} 
                          className="group/link inline-flex items-center gap-4 text-[11px] tracking-[0.3em] uppercase font-bold text-black border-b border-black/10 pb-2 hover:border-black transition-all duration-500"
                        >
                          KOLEKSİYONU KEŞFET
                          <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover/link:translate-x-2" />
                        </Link>
                      </div>
                    </div>

                    {/* Image Column */}
                    <div className="w-full lg:w-1/2 relative">
                      <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden shadow-2xl group/img z-0">
                        <Image
                          src={collection.image1 || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format"}
                          alt={collection.title}
                          fill
                          className="object-cover transition-transform duration-1000 group-hover/img:scale-105"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      </div>
                      
                      {/* Secondary Accent Image */}
                      {collection.image2 && (
                        <div className={`absolute bottom-[-10%] ${isEven ? 'right-[-5%] md:right-[-12%]' : 'left-[-5%] md:left-[-12%]'} w-[50%] md:w-[45%] h-[60%] z-10 shadow-2xl overflow-hidden border-[12px] border-white hidden sm:block h-fit`}>
                           <div className="relative aspect-[3/4]">
                              <Image
                                src={collection.image2}
                                alt={`${collection.title} detail`}
                                fill
                                className="object-cover"
                                sizes="25vw"
                              />
                           </div>
                        </div>
                      )}
                      
                      {/* Background decorative square */}
                      <div className={`absolute -z-10 top-12 ${isEven ? '-left-12' : '-right-12'} w-3/4 h-3/4 bg-gray-50 hidden lg:block`}></div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. BOTTOM CTA SECTION */}
      <section className="py-32 md:py-48 px-6 bg-gray-50 text-center">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-5xl md:text-7xl font-serif font-extralight tracking-tight text-black italic">
            Kendi hikayenizi yazın
          </h2>
          <p className="text-gray-500 font-light text-lg max-w-2xl mx-auto leading-relaxed">
             Her koleksiyon, farklı bir duyguya dokunur. Size uygun olanı keşfedin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link 
              href="/collections/all"
              className="bg-black text-white px-10 py-5 text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-black/90 transition-all duration-300 shadow-xl"
            >
              TÜM KOLEKSİYONLAR
            </Link>
            <Link 
              href="/new-arrivals"
              className="bg-white text-black border border-black/10 px-10 py-5 text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-gray-50 transition-all duration-300"
            >
              YENİ ÜRÜNLERİ GÖR
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
