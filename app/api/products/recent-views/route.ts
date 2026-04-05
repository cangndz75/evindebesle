import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    const localIds = idsParam ? idsParam.split(",").filter((id) => id) : [];

    let dbProducts: any[] = [];
    let userHistoryProducts: any[] = [];

    if (localIds.length > 0) {
      dbProducts = await prisma.product.findMany({
        where: {
          id: { in: localIds },
        },
        include: {
          colors: {
            take: 5,
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
                },
                take: 1,
              },
            },
          },
        },
      });
    }

    if (user) {
      const views = await prisma.productViewHistory.findMany({
        where: { userId: user.id },
        include: {
          product: {
            include: {
              colors: {
                take: 5,
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
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: { viewedAt: "desc" },
        take: 20,
      });
      userHistoryProducts = views.map((v: any) => v.product);
    }


    const allProducts = [...userHistoryProducts, ...dbProducts];
    const uniqueMap = new Map();

    allProducts.forEach((product) => {
      if (!product) return;
      if (!uniqueMap.has(product.id)) {
        const colors = product.colors?.map((color: any) => {
          let images: string[] = [];
          if (color.images) {
            try {
              images = typeof color.images === "string" ? JSON.parse(color.images) : color.images;
            } catch {
              images = [color.images as string];
            }
          }
          return { ...color, images };
        });

        uniqueMap.set(product.id, {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image,
          primaryImage: product.primaryImage,
          colors: colors || [],
        });
      }
    });

    const products = Array.from(uniqueMap.values());


    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching recent views:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
