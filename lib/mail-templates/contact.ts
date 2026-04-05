export const generateContactEmailHtml = (form: {
  name: string
  email: string
  phone: string
  message: string
}) => {
  return `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="margin-bottom: 20px; color: #111;">📩 Yeni İletişim Formu Mesajı</h2>

      <p><strong>👤 Ad Soyad:</strong> ${form.name}</p>
      <p><strong>📧 Email:</strong> <a href="mailto:${form.email}">${form.email}</a></p>
      <p><strong>📞 Telefon:</strong> ${form.phone}</p>
      <p><strong>💬 Mesaj:</strong></p>
      <div style="white-space: pre-wrap; border-left: 4px solid #ccc; padding-left: 10px; margin-top: 5px;">${form.message}</div>

      <hr style="margin: 24px 0" />
      <p style="font-size: 13px; color: #999;">Bu mesaj dark-velvet.com iletişim formu üzerinden gönderildi.</p>
    </div>
  `
}
