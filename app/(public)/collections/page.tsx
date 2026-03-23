import { prisma } from "@/lib/db";
import type { Product as HomeProduct } from "@/lib/homeData";
import Link from "next/link";
import Image from "next/image";

function parseImages(images: string | null): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [images];
  }
}

export const metadata = {
  title: "Koleksiyonlar | Evin",
  description: "Özel koleksiyonlarımızı keşfedin.",
};

export const revalidate = 3600;
export const dynamic = "force-dynamic";

async function getCollections() {
  try {
    const items = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        products: {
          orderBy: { order: "asc" },
          take: 4, // Sadece koleksiyon başına 4 ürün çekelim önizleme için
          include: {
            product: {
              include: {
                colors: { take: 1, select: { id: true, images: true } }
              }
            }
          }
        }
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
    <div className="w-full bg-[#fdfcfb] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-12 pt-32">
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight uppercase text-[#111] mb-4">KOLEKSİYONLAR</h1>
          <p className="text-[#111]/60 max-w-2xl mx-auto font-light leading-relaxed">
            Sezonun ruhunu yakalayan özel tasarımlarımızla tanışın. Her bir koleksiyonumuz kendine has bir hikaye anlatıyor.
          </p>
        </div>

        {collections.length === 0 ? (
           <div className="text-center py-20 text-[#111]/50 font-light">Mevcut aktif koleksiyon bulunmuyor.</div>
        ) : (
           <div className="space-y-32">
              {collections.map((collection: any, idx: number) => {
                 const isEven = idx % 2 === 0;

                 return (
                    <div key={collection.id} className={`flex flex-col gap-12 lg:gap-20 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center`}>
                       
                       {/* Sol / Sağ Görsel Büyüğü */}
                       <div className="w-full lg:w-1/2">
                          <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden shadow-sm group">
                             <Image 
                               src={collection.image1 || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop"}
                               alt={collection.title}
                               fill
                               className="object-cover transition-transform duration-1000 group-hover:scale-105"
                               sizes="(max-width: 1024px) 100vw, 50vw"
                             />
                             <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:opacity-0" />
                          </div>
                          
                          {collection.image2 && (
                             <div className={`absolute ${isEven ? 'right-0 lg:-right-12' : 'left-0 lg:-left-12'} -bottom-16 w-[40%] aspect-square shadow-xl overflow-hidden hidden md:block z-10 border-4 border-white`}>
                                <Image
                                   src={collection.image2}
                                   alt={`${collection.title} detail`}
                                   fill
                                   className="object-cover"
                                />
                             </div>
                          )}
                       </div>

                       {/* Yazı ve Ürünler */}
                       <div className="w-full lg:w-1/2 flex flex-col justify-center">
                          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-[#111] uppercase mb-4">{collection.title}</h2>
                          {collection.description && (
                             <p className="text-[#111]/70 font-light leading-relaxed mb-8 max-w-lg">
                                {collection.description}
                             </p>
                          )}

                          <div className="grid grid-cols-2 gap-4 mt-6">
                             {collection.products.map((cp: any) => {
                                const p = cp.product;
                                let image = p.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";
                                if (!p.image && p.colors && p.colors.length > 0) {
                                   try {
                                      const images = typeof p.colors[0].images === "string" ? JSON.parse(p.colors[0].images) : p.colors[0].images;
                                      if (images && images.length > 0) image = images[0];
                                   } catch (e) {}
                                }
                                const url = p.slug ? `/products/${p.slug}` : `/products/${p.id}`;

                                return (
                                   <Link href={url} key={p.id} className="group flex flex-col">
                                      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden mb-3">
                                         <Image src={image} alt={p.name} fill className="object-cover transition-opacity duration-500 group-hover:opacity-80" />
                                      </div>
                                      <h3 className="text-xs uppercase font-light truncate">{p.name}</h3>
                                      <p className="text-xs font-medium text-[#111] mt-1">₺{p.price}</p>
                                   </Link>
                                );
                             })}
                          </div>

                          <div className="mt-8">
                            <Link href={`/collections/${collection.slug}`} className="inline-block border-b border-[#111] pb-1 text-sm uppercase tracking-wider font-light hover:text-gray-500 hover:border-gray-500 transition-colors">
                              KOLEKSİYONU KEŞFET
                            </Link>
                          </div>
                       </div>
                    </div>
                 );
              })}
           </div>
        )}
      </div>
    </div>
  );
}
