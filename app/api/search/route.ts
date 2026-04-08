import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function normalizeForSearch(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildQueryVariants(query: string) {
  const normalized = normalizeForSearch(query);
  const compact = normalized.replace(/([a-z0-9])\1{1,}/g, "$1").trim();
  const set = new Set<string>();
  if (normalized) set.add(normalized);
  if (compact) set.add(compact);
  return Array.from(set);
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const v0 = new Array<number>(b.length + 1);
  const v1 = new Array<number>(b.length + 1);

  for (let i = 0; i <= b.length; i += 1) v0[i] = i;

  for (let i = 0; i < a.length; i += 1) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j += 1) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(
        v1[j] + 1,
        v0[j + 1] + 1,
        v0[j] + cost
      );
    }
    for (let j = 0; j <= b.length; j += 1) v0[j] = v1[j];
  }

  return v1[b.length];
}

function fuzzyMatchText(text: string, queryVariants: string[]) {
  const normalizedText = normalizeForSearch(text);
  if (!normalizedText) return false;

  const textTokens = normalizedText.split(" ").filter(Boolean);

  for (const variant of queryVariants) {
    if (!variant) continue;
    if (normalizedText.includes(variant)) return true;

    const queryTokens = variant.split(" ").filter(Boolean);
    const allTokensMatch = queryTokens.every((token) => {
      if (normalizedText.includes(token)) return true;
      if (token.length < 4) return false;

      return textTokens.some((textToken) => {
        const lenDiff = Math.abs(textToken.length - token.length);
        if (lenDiff > 1) return false;
        return levenshtein(textToken, token) <= 1;
      });
    });

    if (allTokensMatch) return true;
  }

  return false;
}

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
      price: { gt: 0 },
    };

    const searchConditions: any[] = [];
    const queryVariants = buildQueryVariants(query);
    if (query && query.length > 0) {
      for (const q of queryVariants) {
        searchConditions.push(
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { detailText: { contains: q, mode: "insensitive" } },
          { stockCode: { contains: q, mode: "insensitive" } },
          {
            tags: {
              some: {
                name: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            colors: {
              some: {
                name: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            category: {
              name: {
                contains: q,
                mode: "insensitive",
              },
            },
          }
        );
      }
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

    const dbTake = query && query.length > 0 ? Math.max(limit, 200) : limit;

    const products = await prisma.product.findMany({
      where,
      take: dbTake,
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
        ["yeni", "new", "yeni ürün", "yeni gelenler", "new arrival"].includes(tag.name.toLowerCase())
      );
      if (isNew) {
        badge = "Yeni";
      } else if (product.originalPrice && product.originalPrice > product.price) {
        badge = "İndirim";
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

    const matchedProducts = queryVariants.length > 0
      ? formattedProducts.filter((product: any) => {
        const searchableText = [
          product.title,
          ...(product.tags || []),
          product.category || "",
        ].join(" ");
        return fuzzyMatchText(searchableText, queryVariants);
      })
      : formattedProducts;

    const finalProducts = matchedProducts.slice(0, limit);

    return NextResponse.json({
      products: finalProducts,
      total: finalProducts.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Arama sırasında bir hata oluştu", products: [], total: 0 },
      { status: 500 }
    );
  }
}
