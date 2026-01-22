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
                take: 1,
              },
            },
          },
          sizes: true,
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
    },
  }));

  return <FavoritesClient favorites={formattedFavorites} bestSellers={bestSellers} />;
}
