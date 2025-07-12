import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.pathname.split("/").pop() || "" 

  const body = await req.json()

  try {
    const updatedPet = await prisma.pet.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updatedPet)
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
