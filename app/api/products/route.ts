import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 300;

const FILTER_CACHE_TTL_MS = 30_000;
const FILTER_CACHE_MAX_ENTRIES = 250;

type CachedFilterResponse = {
  expiresAt: number;
  payload: any[];
};

const filterResponseCache = new Map<string, CachedFilterResponse>();

function getFilterCacheKey(searchParams: URLSearchParams) {
  return `v2:${searchParams.toString()}`;
}

function getCachedFilterResponse(key: string) {
  const cached = filterResponseCache.get(key);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    filterResponseCache.delete(key);
    return null;
  }

  return cached.payload;
}

function setCachedFilterResponse(key: string, payload: any[]) {
  if (filterResponseCache.size >= FILTER_CACHE_MAX_ENTRIES) {
    const firstKey = filterResponseCache.keys().next().value;
    if (firstKey) filterResponseCache.delete(firstKey);
  }

  filterResponseCache.set(key, {
    payload,
    expiresAt: Date.now() + FILTER_CACHE_TTL_MS,
  });
}

export async function GET(request: NextRequest) {
  const requestStart = performance.now();
  const { searchParams } = new URL(request.url);
  const cacheKey = getFilterCacheKey(searchParams);

  const cachedPayload = getCachedFilterResponse(cacheKey);
  if (cachedPayload) {
    const response = NextResponse.json(cachedPayload);
    const totalMs = performance.now() - requestStart;
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    response.headers.set("X-Filter-Cache", "HIT");
    response.headers.set("X-Response-Time-Ms", totalMs.toFixed(2));
    response.headers.set("Server-Timing", `app;dur=${totalMs.toFixed(2)}`);
    return response;
  }

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

  if (genders.length > 0) {
    where.gender = { in: genders };
  }

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
    where.OR = [
      {
        sizes: {
          some: {
            name: {
              in: sizes,
            },
            stock: {
              gt: 0,
            },
          },
        },
      },
      {
        variants: {
          some: {
            isActive: true,
            stock: {
              gt: 0,
            },
            size: {
              is: {
                name: {
                  in: sizes,
                },
              },
            },
          },
        },
      },
    ];
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

  if (fabricType) {
    where.fabricType = {
      contains: fabricType,
      mode: "insensitive",
    };
  }

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
  } else if (sort === "az") {
    orderBy = { name: "asc" };
  } else if (sort === "za") {
    orderBy = { name: "desc" };
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
    },
    orderBy,
  });

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

  parsedProducts.sort((a: any, b: any) => {
    const totalStockA = a.colors.reduce((sum: number, c: any) => 
      sum + (c.variants?.reduce((vs: number, v: any) => vs + (v.stock || 0), 0) || 0), 0);
    const totalStockB = b.colors.reduce((sum: number, c: any) => 
      sum + (c.variants?.reduce((vs: number, v: any) => vs + (v.stock || 0), 0) || 0), 0);
    const inStockA = totalStockA > 0 ? 1 : 0;
    const inStockB = totalStockB > 0 ? 1 : 0;
    return inStockB - inStockA; // Stokta olanlar önce
  });

  setCachedFilterResponse(cacheKey, parsedProducts);

  const response = NextResponse.json(parsedProducts);
  const totalMs = performance.now() - requestStart;

  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  response.headers.set("X-Filter-Cache", "MISS");
  response.headers.set("X-Response-Time-Ms", totalMs.toFixed(2));
  response.headers.set("X-Result-Count", String(parsedProducts.length));
  response.headers.set("Server-Timing", `db+app;dur=${totalMs.toFixed(2)}`);

  return response;
}
