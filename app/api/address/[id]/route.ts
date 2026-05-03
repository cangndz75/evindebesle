import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authConfig);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json();

  let districtId = body.districtId;

  if (body.city && body.district) {
    let district = await prisma.district.findFirst({
      where: { city: body.city, name: body.district },
    });
    if (!district) {
      district = await prisma.district.create({
        data: { city: body.city, name: body.district },
      });
    }
    districtId = district.id;
  }

  const updated = await prisma.userAddress.update({
    where: { id, userId: session.user.id },
    data: {
      fullAddress: body.fullAddress,
      districtId,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authConfig);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  await prisma.userAddress.delete({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
