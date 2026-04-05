import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { cache } from "react";

export const revalidate = 300;

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

const getCollectionBySlug = cache(async (slug: string) => {
  return prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          product: {
            include: {
              category: true,
              colors: true,
            }
          }
        },
        orderBy: { order: "asc" }
      }
    }
  });
});

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  return {
    title: collection ? `${collection.title} Koleksiyonu | Dark Velvet` : "Koleksiyon Bulunamadı",
    description: collection?.description || "Özel koleksiyonlarımızı keşfedin."
  };
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection || !collection.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      
      <div className="relative h-[70vh] w-full overflow-hidden">
        <Image
          src={collection.image1 || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format"}
          alt={collection.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-6 backdrop-blur-[2px]">
          <div className="max-w-4xl space-y-6">
            <h1 className="text-6xl md:text-8xl font-serif font-extralight text-white tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {collection.title}
            </h1>
            <div className="h-px w-24 bg-white/50 mx-auto"></div>
            <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              {collection.description || "Zarafet ve modernliğin buluştuğu özel seçki."}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4">
            <span className="text-[10px] tracking-[0.4em] uppercase font-bold text-black/40">Sınırlı Üretim</span>
            <h2 className="text-4xl font-serif font-light text-black">Parçaları Keşfedin</h2>
          </div>
          <div className="text-sm text-black/60 font-light italic">
            {collection.products.length} özel tasarım ürün
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
          {collection.products.map(({ product }: { product: any }, idx: number) => (
            <Link 
              key={product.id} 
              href={`/products/${product.slug}`} 
              className="group"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 mb-6 group-hover:shadow-2xl transition-all duration-700">
                <Image
                  src={product.primaryImage || product.image || "/placeholder.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                
                
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
                    İNDİRİM
                  </div>
                )}

                
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <span className="text-white text-[11px] font-bold tracking-[0.3em] uppercase border-b border-white pb-1">İncele</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-sm font-light text-black/80 group-hover:text-black transition-colors uppercase tracking-wide truncate">
                    {product.name}
                  </h3>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-base font-medium">{product.price.toLocaleString('tr-TR')} TL</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-black/30 line-through">
                      {product.originalPrice.toLocaleString('tr-TR')} TL
                    </span>
                  )}
                </div>
                
                
                {product.colors && product.colors.length > 0 && (
                  <div className="flex gap-1.5 pt-1">
                    {product.colors.slice(0, 4).map((color: any) => (
                      <div 
                        key={color.id} 
                        className="w-2 h-2 rounded-full border border-black/5" 
                        style={{ backgroundColor: color.hexCode || '#ccc' }}
                      />
                    ))}
                    {product.colors.length > 4 && (
                      <span className="text-[10px] text-black/30">+{product.colors.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      
      {collection.image2 && collection.image3 && (
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 mt-40 grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={collection.image2}
              alt="Koleksiyon detayı"
              fill
              className="object-cover shadow-2xl"
            />
            <div className="absolute -bottom-10 -right-10 w-64 h-80 bg-black/5 -z-10 animate-pulse"></div>
          </div>
          <div className="flex flex-col justify-center space-y-10 group">
            <div className="space-y-4">
               <h4 className="text-5xl font-serif font-light leading-tight italic">
                 Sizin için <br/> özenle <br/> seçtik.
               </h4>
               <p className="text-black/50 font-light max-w-sm leading-relaxed">
                 Koleksiyonun her bir parçası, kumaş kalitesinden dikiş detayına kadar Dark Velvet standartlarında tasarlandı.
               </p>
            </div>
            <div className="relative aspect-[3/4] w-full max-w-sm ml-auto overflow-hidden">
                <Image
                  src={collection.image3}
                  alt="Koleksiyon detayı 2"
                  fill
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-1000 shadow-xl"
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
