import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// POST: Ürün görüntüleme kaydı ekle
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    // Aynı kullanıcı aynı ürünü son 1 saat içinde görüntülediyse kayıt ekleme
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentView = await prisma.productViewHistory.findFirst({
      where: {
        productId: id,
        userId: user?.id || null,
        viewedAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentView) {
      return NextResponse.json({ message: "Already viewed recently" });
    }

    // Yeni görüntüleme kaydı ekle
    await prisma.productViewHistory.create({
      data: {
        productId: id,
        userId: user?.id || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording product view:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
