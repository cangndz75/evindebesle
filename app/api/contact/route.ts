import { generateContactEmailHtml } from "@/lib/mail-templates/contact"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { name, email, phone, message } = await req.json()

  const htmlContent = generateContactEmailHtml({ name, email, phone, message })

  await resend.emails.send({
    from: "EvindeBesle <info@evindebesle.com>",
    to: ["info@evindebesle.com", "evindebesle34@gmail.com"],
    subject: "Yeni İletişim Formu Mesajı",
    html: htmlContent,
  })

  return new Response(JSON.stringify({ success: true }))
}
