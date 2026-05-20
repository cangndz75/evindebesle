export function generateBackInStockEmailHtml({
  productName,
  productUrl,
  imageUrl,
}: {
  productName: string;
  productUrl: string;
  imageUrl?: string | null;
}) {
  const imageBlock = imageUrl
    ? `<img src="${imageUrl}" alt="${productName}" width="280" style="max-width:100%;height:auto;border-radius:8px;margin:0 auto 24px;display:block;" />`
    : "";

  return `
  <div style="background-color:#f7f5f2;padding:32px 16px;margin:0;font-family:Georgia,'Times New Roman',serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:auto;background-color:#ffffff;border:1px solid #e8e4df;">
      <tr>
        <td style="padding:32px 32px 12px;text-align:center;border-bottom:1px solid #f0ede8;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#888;">Dark Velvet</p>
          <h1 style="margin:0;font-size:24px;font-weight:400;color:#111;">Beklediğin parça stoklara girdi!</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;text-align:center;">
          ${imageBlock}
          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444;font-family:Arial,sans-serif;">
            <strong style="color:#111;">${productName}</strong> yeniden stoklarımızda. Tükenmeden incelemenizi öneririz.
          </p>
          <a href="${productUrl}" style="background-color:#111;color:#fff;padding:14px 36px;text-decoration:none;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-family:Arial,sans-serif;display:inline-block;">
            Ürüne Git
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;font-size:11px;color:#aaa;text-align:center;border-top:1px solid #f0ede8;font-family:Arial,sans-serif;">
          © ${new Date().getFullYear()} Dark Velvet
        </td>
      </tr>
    </table>
  </div>
  `;
}
