import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 })

  const { consent } = await req.json()
  if (typeof consent !== "boolean") {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 })
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })

  if (!currentUser?.email) {
    return NextResponse.json({ error: "Kullanıcı e-posta bilgisi bulunamadı" }, { status: 400 })
  }

  const operations = [
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        marketingEmailConsent: consent,
      },
    }),
    consent
      ? prisma.subscriber.upsert({
          where: { email: currentUser.email },
          update: { isActive: true },
          create: { email: currentUser.email, isActive: true },
        })
      : prisma.subscriber.deleteMany({
          where: { email: currentUser.email },
        }),
  ]

  await prisma.$transaction(operations)

  return NextResponse.json({ success: true })
}
