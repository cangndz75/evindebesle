import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId: user.id },
      orderBy: [
        { isPrimary: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Adresler alınamadı:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
