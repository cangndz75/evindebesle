// import { NextRequest, NextResponse } from "next/server"
// import { prisma } from "@/lib/db"

// export async function PUT(req: NextRequest) {
//   const body = await req.json()
//   const id = req.nextUrl.pathname.split("/").pop()!

//     if (!id) {
//         return NextResponse.json({ error: "ID bulunamadı" }, { status: 400 })
//     }
//     if (!body || typeof body !== "object") {
//         return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 })
//         }

//   try {
//     const updated = await prisma.pet.update({
//       where: { id },
//       data: body,
//     })

//     return NextResponse.json(updated)
//   } catch (error) {
//     return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 })
//   }
// }

// export async function DELETE(req: NextRequest) {
//     const parts = req.nextUrl.pathname.split("/").filter(Boolean)
//     const id = parts[parts.length - 1]

//   if (!id) {
//     return NextResponse.json({ error: "ID bulunamadı" }, { status: 400 })
//   }

//   try {
//     await prisma.pet.delete({ where: { id } })
//     return NextResponse.json({ success: true })
//   } catch (error) {
//     return NextResponse.json({ error: "Silme başarısız" }, { status: 500 })
//   }
// }
