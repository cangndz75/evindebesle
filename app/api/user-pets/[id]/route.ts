import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await prisma.ownedPet.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true, deleted });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const updated = await prisma.ownedPet.update({
    where: {
      id,
    },
    data: {
      name: body.name,
      age: body.age,
      gender: body.gender,
      image: body.image || null,
      allergy: body.allergy || null,
      sensitivity: body.sensitivity || null,
      specialNote: body.specialNote || null,
      relation: body.relation || null,
      allowAdUse: body.allowAdUse ?? false,
    },
  });

  return NextResponse.json(updated);
}
