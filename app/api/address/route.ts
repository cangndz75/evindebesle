import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const addresses = await prisma.userAddress.findMany({
    where: { userId: session.user.id },
    include: { district: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    addresses.map((addr) => ({
      id: addr.id,
      districtId: addr.districtId,
      districtName: addr.district?.name || "",
      fullAddress: addr.fullAddress,
      isPrimary: addr.isPrimary,
    }))
  );
}


export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { districtId, fullAddress } = await req.json();

  const existingAddresses = await prisma.userAddress.findMany({
    where: { userId: session.user.id },
  });

  const isFirst = existingAddresses.length === 0;

  const newAddress = await prisma.userAddress.create({
    data: {
      userId: session.user.id,
      districtId,
      fullAddress,
      isPrimary: isFirst,
    },
  });

  if (isFirst) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        districtId,
        fullAddress,
      },
    });
  }

  return NextResponse.json(newAddress);
}
