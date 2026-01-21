"use client";

import Image from "next/image";
import Link from "next/link";

type ProductColor = {
  name: string;
  hexCode?: string;
  images: string[];
  variants?: any[];
};

type Product = {
  id: string;
  name: string;
  slug?: string | null;
  price: number;
  image?: string | null;
  primaryImage?: string | null;
  colors: ProductColor[];
  sizes: any[];
  tags: any[];
};

type Favorite = {
  id: string;
  productId: string;
  product: Product;
  createdAt: Date;
};

export default function SharedFavoritesClient({
  favorites,
  userName,
}: {
  favorites: Favorite[];
  userName: string;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-[#111] mb-2">
            {userName}'in Favorileri
          </h1>
          <p className="text-sm text-[#111]/60 font-light">
            Paylaşılan favori listesi
          </p>
        </div>

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <div className="text-center py-12 text-[#111]/60">
            <p className="text-lg">Bu listede henüz ürün yok</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {favorites.map((favorite) => {
              const product = favorite.product;
              const productImage =
                product.colors[0]?.images[0] ||
                product.primaryImage ||
                product.image ||
                "/placeholder.jpg";

              const productUrl = product.slug
                ? `/products/${product.slug}`
                : `/product/${product.id}`;

              return (
                <div key={favorite.id} className="group">
                  <Link href={productUrl} className="block">
                    <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100">
                      <Image
                        src={productImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                      />
                    </div>
                  </Link>

                  <div className="mb-2">
                    <h3 className="text-sm md:text-base font-light text-[#111] mb-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm md:text-base font-light text-[#111]">
                        {product.price.toFixed(2)} ₺
                      </span>
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
