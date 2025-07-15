import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // tags güncellemesi için önce eski taglar silinip sonra yeni oluşturulabilir
  if (body.petIds) {
    await prisma.serviceTag.deleteMany({ where: { serviceId: id } });
  }

  const updated = await prisma.service.update({
    where: { id },
    data: {
      ...body,
      tags: body.petIds
        ? {
            create: body.petIds.map((petId: string) => ({ petId })),
          }
        : undefined,
    },
    include: { tags: { include: { pet: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.service.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
