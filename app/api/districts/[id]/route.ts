import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;

  await prisma.district.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "İlçe adı gerekli" }, { status: 400 });
  }

  const updated = await prisma.district.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json(updated);
}
