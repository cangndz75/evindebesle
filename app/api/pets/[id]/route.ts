import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params
  const data = await req.json()

  try {
    const updated = await prisma.pet.update({
      where: { id },
      data,
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Güncelleme hatası" }, { status: 500 })
  }
}


export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.pet.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Silme işlemi başarısız" }, { status: 500 })
  }
}
