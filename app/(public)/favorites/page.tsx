import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import FavoritesClient from "./_components/FavoritesClient";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth-tabs");
  }

  const favorites = await prisma.productFavorite.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          colors: {
            include: {
              variants: {
                select: {
                  id: true,
                  variantCode: true,
                  colorId: true,
                  sizeId: true,
                  stock: true,
                  price: true,
                },
              },
            },
          },
          sizes: true,
          sizeOptions: true,
          tags: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Çok satanlar için örnek ürünler (şimdilik boş, sonra veritabanından çekilecek)
  // TODO: Veritabanından çok satan ürünleri çek
  const bestSellers = await prisma.product.findMany({
    take: 8,
    include: {
      colors: {
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Type dönüşümü: null -> undefined
  const formattedFavorites = favorites.map((favorite) => ({
    ...favorite,
    product: {
      ...favorite.product,
      slug: favorite.product.slug ?? undefined,
      image: favorite.product.image ?? undefined,
      primaryImage: favorite.product.primaryImage ?? undefined,
      colors: favorite.product.colors.map((color) => ({
        id: color.id,
        name: color.name,
        hexCode: color.hexCode ?? undefined,
        images: color.images 
          ? (typeof color.images === 'string' ? JSON.parse(color.images) : color.images)
          : [],
        variants: color.variants || [],
      })),
      sizeOptions: favorite.product.sizeOptions || [],
    },
  }));

  // bestSellers için type dönüşümü
  const formattedBestSellers = bestSellers.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug ?? undefined,
    price: product.price,
    image: product.image ?? undefined,
    primaryImage: product.primaryImage ?? undefined,
    colors: product.colors?.map((color) => ({
      id: color.id,
      name: color.name,
      hexCode: color.hexCode ?? undefined,
      images: color.images ? (typeof color.images === 'string' ? JSON.parse(color.images) : color.images) : [],
    })) || [],
  }));

  return <FavoritesClient favorites={formattedFavorites} bestSellers={formattedBestSellers} />;
}
