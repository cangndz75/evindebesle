export const generateResetPasswordEmailHtml = ({
  name,
  resetUrl,
}: {
  name: string
  resetUrl: string
}) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2>Merhaba ${name},</h2>
      <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">
          Şifremi Sıfırla
        </a>
      </p>
      <p>Bu bağlantı 1 saat içinde geçerliliğini yitirecektir.</p>
      <hr style="margin:24px 0;" />
      <p style="font-size:13px; color:#888;">Bu e-posta evindebesle.com üzerinden gönderilmiştir.</p>
    </div>
  `
}
