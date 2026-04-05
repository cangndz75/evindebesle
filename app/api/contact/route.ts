import { generateContactEmailHtml } from "@/lib/mail-templates/contact"
import { Resend } from "resend"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "İletişim formu için giriş yapmalısınız" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { name, email, phone, message } = await req.json()

  const normalizedName = typeof name === "string" ? name.trim() : ""
  const normalizedEmail = typeof email === "string" ? email.trim() : ""
  const normalizedPhone = typeof phone === "string" ? phone.trim() : ""
  const normalizedMessage = typeof message === "string" ? message.trim() : ""

  if (!normalizedName || !normalizedEmail || !normalizedMessage) {
    return new Response(JSON.stringify({ error: "Ad soyad, e-posta ve mesaj zorunludur" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return new Response(JSON.stringify({ error: "Geçerli bir e-posta girin" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      subject: `İletişim Formu - ${normalizedName}`,
      category: "other",
      priority: "normal",
      status: "open",
      messages: {
        create: {
          userId: session.user.id,
          isAdmin: false,
          content: `İletişim formu mesajı\nAd: ${normalizedName}\nE-posta: ${normalizedEmail}\nTelefon: ${normalizedPhone || "-"}\n\nMesaj:\n${normalizedMessage}`,
        },
      },
    },
    select: { id: true },
  })

  const htmlContent = generateContactEmailHtml({
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    message: normalizedMessage,
  })

  try {
    await resend.emails.send({
      from: "Dark Velvet <info@dark-velvet.com>",
      to: ["info@dark-velvet.com"],
      subject: "Yeni İletişim Formu Mesajı",
      html: htmlContent,
    })
  } catch {
  }

  return new Response(JSON.stringify({ success: true, ticketId: ticket.id }), {
    headers: { "Content-Type": "application/json" },
  })
}
