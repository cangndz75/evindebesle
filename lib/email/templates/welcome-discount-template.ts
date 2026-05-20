export function generateWelcomeDiscountEmailHtml({
  discountLabel,
  discountCode,
  shopUrl,
  validDays,
}: {
  discountLabel: string;
  discountCode: string;
  shopUrl: string;
  validDays: number;
}) {
  return `
  <div style="background-color:#f7f5f2;padding:32px 16px;margin:0;font-family:Georgia,'Times New Roman',serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:auto;background-color:#ffffff;border:1px solid #e8e4df;">
      <tr>
        <td style="padding:32px 32px 16px;text-align:center;border-bottom:1px solid #f0ede8;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#888;">Dark Velvet</p>
          <h1 style="margin:0;font-size:26px;font-weight:400;color:#111;letter-spacing:0.02em;">Aramıza Hoş Geldin</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;text-align:center;">
          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444;font-family:Arial,sans-serif;">
            İlk siparişinde geçerli <strong style="color:#111;">${discountLabel}</strong> indirim kodun hazır.
          </p>
          <div style="background-color:#f7f5f2;border:1px solid #e0dcd6;padding:20px 24px;margin:24px 0;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#888;font-family:Arial,sans-serif;">İndirim Kodun</p>
            <p style="margin:0;font-size:28px;font-weight:600;letter-spacing:0.12em;color:#111;font-family:'Courier New',monospace;">${discountCode}</p>
          </div>
          <p style="margin:0 0 28px;font-size:13px;color:#777;font-family:Arial,sans-serif;">
            Kod tek kullanımlıktır ve ${validDays} gün geçerlidir. Ödeme adımında kupon alanına yapıştırman yeterli.
          </p>
          <a href="${shopUrl}" style="background-color:#111;color:#fff;padding:14px 36px;text-decoration:none;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-family:Arial,sans-serif;display:inline-block;">
            Alışverişe Başla
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;font-size:11px;color:#aaa;text-align:center;border-top:1px solid #f0ede8;font-family:Arial,sans-serif;">
          © ${new Date().getFullYear()} Dark Velvet · Bu e-posta hoş geldin kampanyası kapsamında gönderilmiştir.
        </td>
      </tr>
    </table>
  </div>
  `;
}
