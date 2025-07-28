import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
    },
  });

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

  return NextResponse.json({
    ...user,
    primaryAddress: primaryAddress || null,
  });
}
