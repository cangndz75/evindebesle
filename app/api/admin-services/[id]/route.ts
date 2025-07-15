import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    return await prisma.$transaction(async (tx) => {
      if (body.petIds) {
        await tx.serviceTag.deleteMany({ where: { serviceId: id } });
      }

      const { petIds, ...rest } = body;
      const updated = await tx.service.update({
        where: { id },
        data: rest,
      });

      if (body.petIds && Array.isArray(body.petIds) && body.petIds.length > 0) {
        await Promise.all(
          body.petIds.map((petId: string) =>
            tx.serviceTag.create({
              data: { serviceId: id, petId },
            })
          )
        );
      }

      const result = await tx.service.findUniqueOrThrow({
        where: { id },
        include: { tags: { include: { pet: true } } },
      });

      return NextResponse.json(result);
    });
  } catch (error) {
    console.error("PATCH /api/admin-services/[id] hata:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
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

