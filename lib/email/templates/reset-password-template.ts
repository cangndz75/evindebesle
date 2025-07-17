export const generateResetPasswordEmailHtml = ({
  name,
  resetUrl,
}: {
  name: string
  resetUrl: string
}) => {
  return `
  <div style="background-color:#f3f4f6;padding:0;margin:0;font-family:Arial,sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;background-color:white;">
      <tr>
        <td style="padding:24px 32px;text-align:left;">
          <h1 style="margin:0;color:#000;font-size:24px;">EvindeBesle</h1>
        </td>
        <td style="padding:24px 32px;text-align:right;font-size:12px;color:#666;">
          "Dostça Hizmet"
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:0 32px;">
          <h2 style="font-size:20px;color:#111;">Merhaba ${name},</h2>
          <p style="font-size:16px;line-height:1.6;color:#333;">
            Şifre değiştirme talebinizi gerçekleştirmek için aşağıdaki şifre değiştir butonuna tıklayarak yeni şifrenizi oluşturabilirsiniz.
          </p>
          <div style="margin:24px 0;text-align:center;">
            <a href="${resetUrl}" style="background-color:#6366f1;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
              Şifremi Güncelle
            </a>
          </div>
          <p style="font-size:14px;color:#777;">
            Bu bağlantı yalnızca 1 saat geçerlidir. Güvenliğiniz için bağlantıyı kimseyle paylaşmayın.
          </p>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:32px;">
          <hr />
          <p style="font-size:13px;color:#555;text-align:center;">
            MÜŞTERİ DESTEK HATTI: 0850 000 00 00<br />
            WHATSAPP DESTEK: +90 500 000 00 00
          </p>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:0 32px 32px;text-align:center;">
          <p style="font-size:14px;font-weight:500;color:#444;">Bizi Takip Et</p>
          <div style="margin-top:8px;">
            <a href="#" style="margin:0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Instagram" width="24" /></a>
            <a href="#" style="margin:0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="24" /></a>
            <a href="#" style="margin:0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Twitter" width="24" /></a>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:16px 32px;font-size:11px;color:#999;text-align:center;">
          © ${new Date().getFullYear()} EvindeBesle. Tüm hakları saklıdır.<br />
          Bu e-posta evindebesle.com üzerinden gönderilmiştir.
        </td>
      </tr>
    </table>
  </div>
  `;
}
