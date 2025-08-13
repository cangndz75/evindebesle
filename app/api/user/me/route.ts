import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Temel kullanıcı + birincil adresi birlikte döndür
  const [user, primaryAddress] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        marketingEmailConsent: true,
      },
    }),
    prisma.userAddress.findFirst({
      where: { userId: session.user.id, isPrimary: true },
      select: { id: true, districtId: true, fullAddress: true },
    }),
  ]);

  return NextResponse.json({
    user,
    primaryAddress: primaryAddress ?? null,
  });
}
