import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import SharedFavoritesClient from "./_components/SharedFavoritesClient";

export default async function SharedFavoritesPage({
  searchParams,
}: {
  searchParams: { lid?: string };
}) {
  const shareId = searchParams.lid;

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
  const favorites = await prisma.productFavorite.findMany({
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

  return (
    <SharedFavoritesClient
      favorites={favorites}
      userName={wishlistShare.user.name}
    />
  );
}
