import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { cache } from "react";
import CollectionDetailProductsGrid from "./CollectionDetailProductsGrid";

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
              colors: {
                include: {
                  variants: {
                    select: {
                      id: true,
                      variantCode: true,
                      colorId: true,
                    },
                    take: 1,
                  },
                },
              },
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

  const productsForGrid = collection.products.map(({ product }: { product: any }) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    primaryImage: product.primaryImage,
    image: product.image,
    colors: (product.colors || []).map((color: any) => {
      const parsedImages = (() => {
        try {
          const parsed = typeof color.images === "string" ? JSON.parse(color.images) : color.images;
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

      return {
        id: color.id,
        name: color.name,
        hexCode: color.hexCode,
        image: parsedImages[0] || null,
        variantCode: color.variants?.[0]?.variantCode || null,
      };
    }),
  }));

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

        <CollectionDetailProductsGrid products={productsForGrid} />
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
            <div className="relative aspect-3/4 w-full max-w-sm ml-auto overflow-hidden">
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
