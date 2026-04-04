import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const { name, image } = await request.json();

  const updated = await prisma.pet.update({
    where: { id },
    data: { name, image },
  });

  return jsonNoStore(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;

  await prisma.pet.delete({
    where: { id },
  });

  return jsonNoStore({ success: true });
}
