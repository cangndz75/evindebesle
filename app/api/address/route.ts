import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      districtId: true,
      fullAddress: true,
      district: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(user);
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user.id) return new NextResponse("Unauthorized", { status: 401 });

  const { districtId, fullAddress } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { districtId, fullAddress },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user.id) return new NextResponse("Unauthorized", { status: 401 });

  const { districtId, fullAddress } = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { districtId, fullAddress },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user.id) return new NextResponse("Unauthorized", { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      districtId: null,
      fullAddress: null,
    },
  });

  return NextResponse.json({ ok: true });
}
