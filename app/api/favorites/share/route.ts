import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { randomUUID } from "crypto";

// POST: Share link oluştur
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kullanıcının mevcut share linki var mı kontrol et
    let shareLink = await prisma.wishlistShare.findUnique({
      where: { userId: user.id },
    });

    // Yoksa yeni oluştur
    if (!shareLink) {
      shareLink = await prisma.wishlistShare.create({
        data: {
          userId: user.id,
          shareId: randomUUID(),
        },
      });
    }

    return NextResponse.json({ shareId: shareLink.shareId });
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
