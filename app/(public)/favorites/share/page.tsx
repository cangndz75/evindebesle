import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import SharedFavoritesClient from "./_components/SharedFavoritesClient";

export default async function SharedFavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ lid?: string }>;
}) {
  const params = await searchParams;
  const shareId = params.lid;

  if (!shareId) {
    notFound();
  }

  // Share ID'ye göre kullanıcıyı bul
  const wishlistShare = await prisma.wishlistShare.findUnique({
    where: { shareId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!wishlistShare) {
    notFound();
  }

  // Kullanıcının favorilerini getir
  const favoritesRaw = await prisma.productFavorite.findMany({
    where: { userId: wishlistShare.userId },
    include: {
      product: {
        include: {
          colors: {
            take: 1,
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

  const favorites = favoritesRaw.map((favorite) => ({
    id: favorite.id,
    productId: favorite.productId,
    createdAt: favorite.createdAt,
    product: {
      id: favorite.product.id,
      name: favorite.product.name,
      slug: favorite.product.slug ?? undefined,
      price: favorite.product.price,
      image: favorite.product.image ?? undefined,
      primaryImage: favorite.product.primaryImage ?? undefined,
      colors: favorite.product.colors.map((color) => ({
        name: color.name,
        hexCode: color.hexCode ?? undefined,
        images: color.images 
          ? (typeof color.images === 'string' ? JSON.parse(color.images) : color.images)
          : [],
        variants: color.variants || [],
      })),
      sizes: favorite.product.sizes || [],
      tags: favorite.product.tags || [],
    },
  }));

  return (
    <SharedFavoritesClient
      favorites={favorites}
      userName={wishlistShare.user.name}
    />
  );
}
