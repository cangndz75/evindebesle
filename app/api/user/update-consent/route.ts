import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 })

  const { consent } = await req.json()

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      marketingEmailConsent: consent,
    },
  })

  return NextResponse.json({ success: true })
}
