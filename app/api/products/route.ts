import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const gender = searchParams.get("gender"); // MALE, FEMALE, UNISEX
  const tag = searchParams.get("tag"); // ProductTag name
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sizes = searchParams.getAll("size"); // Array of sizes
  const colors = searchParams.getAll("color"); // Array of color names
  const fabricType = searchParams.get("fabricType");
  const isActive = searchParams.get("isActive") !== "false"; // Default true

  const where: any = {
    isActive,
  };

  // Gender filter
  if (gender) {
    where.gender = gender;
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

  const products = await prisma.product.findMany({
    where,
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
      tags: true,
      reviews: {
        where: { isApproved: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}
