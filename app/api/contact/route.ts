import { generateContactEmailHtml } from "@/lib/mail-templates/contact"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { name, email, phone, message } = await req.json()

  const htmlContent = generateContactEmailHtml({ name, email, phone, message })

  await resend.emails.send({
    from: "Dark Velvet <info@dark-velvet.com>",
    to: ["info@dark-velvet.com"],
    subject: "Yeni İletişim Formu Mesajı",
    html: htmlContent,
  })

  return new Response(JSON.stringify({ success: true }))
}
