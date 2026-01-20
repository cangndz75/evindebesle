import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET: Ürünün favorilerde olup olmadığını kontrol et
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ isFavorite: false });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ isFavorite: false });
    }

    const favorite = await prisma.productFavorite.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    return NextResponse.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("Error checking favorite:", error);
    return NextResponse.json({ isFavorite: false });
  }
}
