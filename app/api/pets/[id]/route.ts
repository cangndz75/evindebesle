import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { name, image } = await req.json()
  const updated = await prisma.pet.update({
    where: { id: params.id },
    data: { name, image },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.pet.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Silme işlemi başarısız" }, { status: 500 })
  }
}