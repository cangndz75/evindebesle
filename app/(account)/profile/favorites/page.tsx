import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import FavoritesClient from "@/app/(public)/favorites/_components/FavoritesClient";

export default async function ProfileFavoritesPage() {
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

  const favoriteProductIds = favorites.map((f: any) => f.productId);

  const productCombinations = await prisma.productCombination.findMany({
    where: {
      productId: {
        in: favoriteProductIds,
      },
    },
    include: {
      relatedProduct: {
        include: {
          colors: {
            take: 1,
          },
        },
      },
    },
    take: 8,
  });

  const formattedFavorites = favorites.map((favorite: any) => ({
    ...favorite,
    product: {
      ...favorite.product,
      slug: favorite.product.slug ?? undefined,
      image: favorite.product.image ?? undefined,
      primaryImage: favorite.product.primaryImage ?? undefined,
      colors: favorite.product.colors.map((color: any) => ({
        id: color.id,
        name: color.name,
        hexCode: color.hexCode ?? undefined,
        images: color.images
          ? (typeof color.images === "string" ? JSON.parse(color.images) : color.images)
          : [],
        variants: color.variants || [],
      })),
      sizeOptions: favorite.product.sizeOptions || [],
    },
  }));

  const completeTheSet = productCombinations.map((combination: any) => ({
    id: combination.relatedProduct.id,
    name: combination.relatedProduct.name,
    slug: combination.relatedProduct.slug ?? undefined,
    price: combination.relatedProduct.price,
    image: combination.relatedProduct.image ?? undefined,
    primaryImage: combination.relatedProduct.primaryImage ?? undefined,
    colors:
      combination.relatedProduct.colors?.map((color: any) => ({
        id: color.id,
        name: color.name,
        hexCode: color.hexCode ?? undefined,
        images: color.images
          ? (typeof color.images === "string" ? JSON.parse(color.images) : color.images)
          : [],
      })) || [],
  }));

  return <FavoritesClient favorites={formattedFavorites} completeTheSet={completeTheSet} />;
}
