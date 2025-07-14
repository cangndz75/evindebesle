import { prisma } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  const body = await request.json();

  const updated = await prisma.service.update({
    where: { id: params.id },
    data: {
      isActive: body.isActive,
      name: body.name,
      description: body.description,
      price: body.price,
      image: body.image,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;

  await prisma.service.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
