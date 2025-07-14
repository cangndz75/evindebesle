import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

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
  } catch (error) {
    return NextResponse.json({ error: "Hizmet güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.service.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Hizmet silinemedi" }, { status: 500 });
  }
}
