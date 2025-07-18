import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const primaryAddress = await prisma.userAddress.findFirst({
    where: {
      userId: session.user.id,
      isPrimary: true,
    },
    select: {
      id: true,
      districtId: true,
      fullAddress: true,
    },
  });

  if (!primaryAddress) {
    return NextResponse.json({ error: "Adres bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(primaryAddress);
}
