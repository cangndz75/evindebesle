import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { z } from "zod";

const addressSchema = z.object({
  districtId: z.string().min(1),
  fullAddress: z.string().min(5),
});

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });

  const existingAddresses = await prisma.userAddress.findMany({
    where: { userId: session.user.id },
  });

  const isFirst = existingAddresses.length === 0;

  const newAddress = await prisma.userAddress.create({
    data: {
      userId: session.user.id,
      districtId: parsed.data.districtId,
      fullAddress: parsed.data.fullAddress,
      isPrimary: isFirst,
    },
  });

  if (isFirst) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        districtId: parsed.data.districtId,
        fullAddress: parsed.data.fullAddress,
      },
    });
  }

  return NextResponse.json(newAddress);
}
