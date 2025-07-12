import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { name, image } = body

  const updatedPet = await prisma.pet.update({
    where: { id: params.id },
    data: { name, image },
  })

  return NextResponse.json(updatedPet)
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
