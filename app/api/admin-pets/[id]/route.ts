import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, image } = await request.json();

  const updated = await prisma.pet.update({
    where: { id },
    data: { name, image },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.pet.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
