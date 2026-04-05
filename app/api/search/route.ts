import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category"); // men, women
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sizes = searchParams.getAll("size");
    const colors = searchParams.getAll("color");
    const sortBy = searchParams.get("sortBy") || "relevance";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      isActive: true,
    };

    const searchConditions: any[] = [];
    if (query && query.length > 0) {
      searchConditions.push(
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { detailText: { contains: query, mode: "insensitive" } },
        { stockCode: { contains: query, mode: "insensitive" } },
        {
          tags: {
            some: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        },
        {
          colors: {
            some: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        },
        {
          category: {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        }
      );
    }

    if (category === "men") {
      where.gender = "MALE";
    } else if (category === "women") {
      where.gender = "FEMALE";
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    if (sizes.length > 0) {
      const sizeConditions: any[] = [
        {
          sizes: {
            some: {
              name: {
                in: sizes,
              },
            },
          },
        },
        {
          sizeOptions: {
            some: {
              name: {
                in: sizes,
              },
            },
          },
        },
      ];

      if (searchConditions.length > 0) {
        where.AND = [
          { OR: searchConditions },
          { OR: sizeConditions },
        ];
      } else {
        where.OR = sizeConditions;
      }
    } else if (searchConditions.length > 0) {
      where.OR = searchConditions;
    }

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

    let orderBy: any = {};
    if (sortBy === "price-low") {
      orderBy = { price: "asc" };
    } else if (sortBy === "price-high") {
      orderBy = { price: "desc" };
    } else if (sortBy === "newest") {
      orderBy = { createdAt: "desc" };
    } else {
      orderBy = [
        { createdAt: "desc" },
        { name: "asc" },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      take: limit,
      orderBy,
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
        createdAt: true,
        colors: {
          take: 1,
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedProducts = products.map((product: any) => {
      let hoverImage: string | undefined;
      if (product.colors.length > 0 && product.colors[0].images) {
        try {
          const images = typeof product.colors[0].images === 'string'
            ? JSON.parse(product.colors[0].images)
            : product.colors[0].images;
          if (Array.isArray(images) && images.length > 1) {
            hoverImage = images[1];
          }
        } catch {
        }
      }

      let badge: string | undefined;
      const isNew = product.tags.some((tag: any) =>
        ["yeni", "new", "yeni Ã¼rÃ¼n", "yeni gelenler", "new arrival"].includes(tag.name.toLowerCase())
      );
      if (isNew) {
        badge = "Yeni";
      } else if (product.originalPrice && product.originalPrice > product.price) {
        badge = "Ä°ndirim";
      }

      return {
        id: product.id,
        title: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.primaryImage || product.image || "",
        hoverImage: hoverImage || product.secondaryImage || undefined,
        badge,
        category: product.gender === "MALE" ? "men" : product.gender === "FEMALE" ? "women" : undefined,
        tags: product.tags.map((t: any) => t.name),
        slug: product.slug,
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      total: formattedProducts.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Arama sÄ±rasÄ±nda bir hata oluÅŸtu", products: [], total: 0 },
      { status: 500 }
    );
  }
}
