import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params
  const body = await req.json()

  try {
    const updatedPet = await prisma.pet.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updatedPet)
  } catch (error) {
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params

  try {
    await prisma.pet.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 })
  }
}
