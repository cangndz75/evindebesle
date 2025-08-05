import { resend } from "@/lib/resend";

export async function sendInvoiceMail({
  to,
  name,
  fileUrl,
}: {
  to: string;
  name: string;
  fileUrl: string;
}) {
  await resend.emails.send({
    from: "fatura@evindebesle.com",
    to: [to, "admin@evindebesle.com"],
    subject: "Faturanız Hazır",
    html: `
      <p>Merhaba ${name},</p>
      <p>Randevunuza ait fatura oluşturulmuştur.</p>
      <a href="${fileUrl}" target="_blank">Faturayı Görüntüle</a>
    `,
  });
}
