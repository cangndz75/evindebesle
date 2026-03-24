import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Cache için revalidate - 5 dakika
export const revalidate = 300;
export const dynamic = 'force-dynamic'; // Filtreler için dynamic

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const genders = searchParams.getAll("gender"); // MALE, FEMALE, UNISEX
  const tag = searchParams.get("tag"); // ProductTag name
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sizes = searchParams.getAll("size"); // Array of sizes
  const colors = searchParams.getAll("color"); // Array of color names
  const fabricType = searchParams.get("fabricType");
  const categoryId = searchParams.get("categoryId");
  const categorySlug = searchParams.get("categorySlug");
  const newArrivalsOnly = searchParams.get("newArrivals") === "true";
  const sort = searchParams.get("sort"); // date-new, date-old, price-low, price-high, featured

  const isActive = searchParams.get("isActive") !== "false"; // Default true
  const take = searchParams.get("take"); // Limit results

  const where: any = {
    isActive,
    price: { gt: 0 }
  };

  if (newArrivalsOnly) {
    where.newArrivalItem = {
      isNot: null,
    };
  }

  const inCollections = searchParams.get("inCollections") === "true";
  if (inCollections) {
    where.collectionItems = {
      some: {
        collection: {
          isActive: true
        }
      }
    };
  }

  // Gender filter
  if (genders.length > 0) {
    where.gender = { in: genders };
  }

  // Tag filter
  if (tag) {
    where.tags = {
      some: {
        name: {
          equals: tag,
          mode: "insensitive",
        },
      },
    };
  }

  // Price filter
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) {
      where.price.gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      where.price.lte = parseFloat(maxPrice);
    }
  }

  // Size filter
  if (sizes.length > 0) {
    where.sizes = {
      some: {
        name: {
          in: sizes,
        },
      },
    };
  }

  // Color filter
  if (colors.length > 0) {
    where.colors = {
      some: {
        name: {
          in: colors,
          mode: "insensitive",
        },
      },
    };
  }

  // Fabric type filter
  if (fabricType) {
    where.fabricType = {
      contains: fabricType,
      mode: "insensitive",
    };
  }

  // Category filter
  if (categoryId) {
    where.categoryId = categoryId;
  } else if (categorySlug) {
    where.category = {
      slug: categorySlug,
    };
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-low") {
    orderBy = { price: "asc" };
  } else if (sort === "price-high") {
    orderBy = { price: "desc" };
  } else if (sort === "date-old") {
    orderBy = { createdAt: "asc" };
  } else if (sort === "date-new") {
    orderBy = { createdAt: "desc" };
  }

  const products = await prisma.product.findMany({
    where,
    take: take ? parseInt(take) : undefined,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      originalPrice: true,
      image: true,
      primaryImage: true,
      secondaryImage: true,
      gender: true,
      fabricType: true,
      createdAt: true,
      colors: {
        select: {
          id: true,
          name: true,
          hexCode: true,
          images: true,
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
      sizes: {
        select: {
          id: true,
          name: true,
          stock: true,
        },
      },
      sizeOptions: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
      reviews: {
        where: { isApproved: true },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          rating: true,
        },
      },
    },
    orderBy,
  });

  // Parse color images JSON strings
  const parsedProducts = products.map((product: any) => {
    const colors = product.colors.map((color: any) => {
      let images: string[] = [];
      if (color.images) {
        try {
          images = typeof color.images === 'string' ? JSON.parse(color.images) : color.images;
        } catch {
          images = [color.images as string];
        }
      }
      return { ...color, images };
    });

    return { ...product, colors };
  });

  const response = NextResponse.json(parsedProducts);

  // Cache headers
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  return response;
}
