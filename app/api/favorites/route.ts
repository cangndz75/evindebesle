import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET: Kullanıcının favorilerini listele
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await prisma.productFavorite.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            colors: {
              take: 1,
              include: {
                variant: true,
              },
            },
            sizes: true,
            tags: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Favorilere ekle
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Zaten favorilerde mi kontrol et
    const existing = await prisma.productFavorite.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Already in favorites", favorite: existing });
    }

    const favorite = await prisma.productFavorite.create({
      data: {
        userId: user.id,
        productId,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({ message: "Added to favorites", favorite });
  } catch (error: any) {
    console.error("Error adding favorite:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Already in favorites" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Favorilerden çıkar
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await prisma.productFavorite.deleteMany({
      where: {
        userId: user.id,
        productId,
      },
    });

    return NextResponse.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
