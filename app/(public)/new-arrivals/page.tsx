import { prisma } from "@/lib/db";
import type { Product } from "@/lib/homeData";
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

function formatProduct(product: any, type: "new-arrivals" | "best-sellers" | "featured"): Product {
  const firstColor = product.colors?.[0];
  const colorImages = firstColor?.images ? parseImages(firstColor.images) : [];
  const mainImage = product.primaryImage || product.image || colorImages[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";

  let hoverImage = product.secondaryImage;
  if (!hoverImage && colorImages.length > 1) {
    hoverImage = colorImages[1];
  }
  if (!hoverImage && product.colors && product.colors.length > 1) {
    for (let i = 1; i < product.colors.length; i++) {
      const otherColorImages = product.colors[i]?.images ? parseImages(product.colors[i].images) : [];
      if (otherColorImages.length > 0) {
        hoverImage = otherColorImages[0];
        break;
      }
    }
  }
  if (!hoverImage) hoverImage = mainImage;

  return {
    id: product.id,
    title: product.name,
    slug: product.slug || undefined,
    price: product.price,
    originalPrice: product.originalPrice || undefined,
    image: mainImage,
    hoverImage: hoverImage !== mainImage ? hoverImage : undefined,
    badge: product.originalPrice ? "İndirim" : "Yeni",
    colors: product.colors?.map((c: any) => {
      const images = parseImages(c.images);
      return {
        id: c.id,
        name: c.name || "",
        value: c.hexCode || "#000000",
        image: images[0] || mainImage,
      };
    }) || [],
    sizes: product.sizes?.map((s: any) => ({ name: s.name, stock: s.stock, id: s.id })) || [],
    sizeOptions: product.sizeOptions?.map((so: any) => ({ name: so.name, id: so.id })) || [],
  };
}

export const metadata = {
  title: "Yeni Gelenler | Evin",
  description: "En yeni ürünlerimizi keşfedin.",
};

async function getNewArrivalProducts() {
  try {
    const items = await prisma.newArrival.findMany({
      orderBy: { order: "asc" },
      include: {
        product: {
          include: {
            colors: {
              take: 1,
              select: { id: true, name: true, hexCode: true, images: true, variants: { select: { id: true, variantCode: true, colorId: true, sizeId: true, stock: true, price: true } } }
            },
            sizes: true,
            sizeOptions: true,
            _count: { select: { orderItems: true } }
          }
        }
      }
    });

    return items.map((item: any) => formatProduct(item.product, "featured"));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function NewArrivalsPage() {
  const products = await getNewArrivalProducts();

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-12 pt-32">
      <div className="mb-12 border-b pb-6">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight uppercase text-[#111]">YENİ GELENLER</h1>
        <p className="text-sm text-gray-500 max-w-2xl mt-2 font-light">
          Sezonun en trend, en çok dikkat çeken yeni parçalarını hemen keşfedin.
        </p>
      </div>

      {products.length === 0 ? (
         <div className="text-center py-20 text-[#111]/50 font-light">Henüz yeni gelen ürün bulunmamaktadır.</div>
      ) : (
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product: Product) => {
               const currentImage = product.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";
               const productUrl = product.slug ? `/products/${product.slug}` : `/products/${product.id}`;

               return (
                  <Link href={productUrl} key={product.id} className="group flex flex-col bg-white">
                     <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
                        <Image
                           src={currentImage}
                           alt={product.title}
                           fill
                           className="object-cover object-center transition-opacity duration-500 group-hover:opacity-90"
                           sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                     </div>
                     <div className="flex-1 flex flex-col mt-2">
                        <h3 className="text-sm font-light text-[#111] uppercase tracking-wide line-clamp-1">
                           {product.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                           {product.originalPrice ? (
                              <>
                                 <p className="text-sm font-light text-[#111]">₺{product.originalPrice.toFixed(2)}</p>
                                 <p className="text-sm font-light text-gray-400 line-through">₺{product.price.toFixed(2)}</p>
                              </>
                           ) : (
                              <p className="text-sm font-light text-[#111]">₺{product.price.toFixed(2)}</p>
                           )}
                        </div>
                     </div>
                  </Link>
               );
            })}
         </div>
      )}
    </div>
  );
}
