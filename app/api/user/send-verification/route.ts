import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"
import { Resend } from "resend"
import { v4 as uuidv4 } from "uuid"

export async function POST() {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 })

  const token = uuidv4()
  const email = session.user.email!

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      emailVerifyToken: token,
      emailVerifyExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  })

    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${token}`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: "do-not-reply@seninsite.com",
    to: email,
    subject: "E-posta Doğrulama",
    html: `<p>E-postanızı doğrulamak için <a href="${verifyUrl}">buraya tıklayın</a>.</p>`,
  })

  return NextResponse.json({ success: true })
}
