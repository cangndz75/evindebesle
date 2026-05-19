import { prisma } from "@/lib/db";
import { resend, resendFromAddress } from "@/lib/resend";

interface InvoiceEmailParams {
  orderId: string;
  invoiceNumber: string;
  pdfUrl: string;
  ettn: string;
}

function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildInvoiceEmailHtml(params: {
  customerName: string;
  orderNumber: string;
  invoiceNumber: string;
  ettn: string;
  totalAmount: number;
  pdfUrl: string;
  orderDate: string;
  siteUrl: string;
}): string {
  const { customerName, orderNumber, invoiceNumber, ettn, totalAmount, pdfUrl, orderDate, siteUrl } = params;

  return `
<!DOCTYPE html>
<html lang="tr" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Faturanız Hazır — Dark Velvet</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#fafafa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;">

          <!-- HEADER -->
          <tr>
            <td style="padding:40px 40px 24px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:300;letter-spacing:4px;color:#ffffff;text-transform:uppercase;">DARK VELVET</h1>
              <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#d4af37,transparent);margin:16px auto 0;"></div>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="padding:0 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #262626;border-radius:16px;overflow:hidden;">

                <!-- Icon -->
                <tr>
                  <td style="padding:40px 40px 20px;text-align:center;">
                    <div style="width:64px;height:64px;margin:0 auto;background:linear-gradient(135deg,#d4af37 0%,#b8860b 100%);border-radius:50%;line-height:64px;font-size:28px;">
                      &#128203;
                    </div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td style="padding:0 40px 8px;text-align:center;">
                    <h2 style="margin:0;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:0.5px;">Faturanız Hazır</h2>
                  </td>
                </tr>

                <!-- Subtitle -->
                <tr>
                  <td style="padding:0 40px 32px;text-align:center;">
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#a3a3a3;">
                      Merhaba <strong style="color:#ffffff;">${escapeHtml(customerName)}</strong>,<br/>
                      siparişinize ait e-Arşiv faturanız başarıyla oluşturuldu.
                    </p>
                  </td>
                </tr>

                <!-- Invoice Details Card -->
                <tr>
                  <td style="padding:0 40px 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:0 0 12px;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#737373;">Sipariş Numarası</p>
                                <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#ffffff;">${escapeHtml(orderNumber)}</p>
                              </td>
                              <td style="padding:0 0 12px;text-align:right;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#737373;">Sipariş Tarihi</p>
                                <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#ffffff;">${escapeHtml(orderDate)}</p>
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding:12px 0;border-top:1px solid #2a2a2a;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td>
                                      <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#737373;">Fatura Numarası</p>
                                      <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#d4af37;">${escapeHtml(invoiceNumber)}</p>
                                    </td>
                                    <td style="text-align:right;">
                                      <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#737373;">Toplam Tutar</p>
                                      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#ffffff;">${escapeHtml(formatCurrency(totalAmount))}</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding:12px 0 0;border-top:1px solid #2a2a2a;">
                                <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#737373;">ETTN</p>
                                <p style="margin:4px 0 0;font-size:12px;font-family:monospace;color:#a3a3a3;word-break:break-all;">${escapeHtml(ettn)}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td style="padding:0 40px 20px;text-align:center;">
                    <a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#d4af37 0%,#b8860b 100%);color:#000000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.5px;text-transform:uppercase;">
                      Faturayı İndir (PDF)
                    </a>
                  </td>
                </tr>

                <!-- Secondary Link -->
                <tr>
                  <td style="padding:0 40px 32px;text-align:center;">
                    <a href="${escapeHtml(siteUrl)}/profile/orders" style="font-size:13px;color:#d4af37;text-decoration:underline;">
                      Siparişlerim sayfasından görüntüle &rarr;
                    </a>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background-color:#262626;"></div>
                  </td>
                </tr>

                <!-- Info Note -->
                <tr>
                  <td style="padding:20px 40px 28px;text-align:center;">
                    <p style="margin:0;font-size:12px;line-height:1.7;color:#737373;">
                      Bu fatura e-Arşiv kapsamında elektronik ortamda oluşturulmuş olup<br/>
                      yasal geçerliliğe sahiptir. Herhangi bir sorunuz için
                      <a href="mailto:info@dark-velvet.com" style="color:#d4af37;text-decoration:none;">info@dark-velvet.com</a>
                      adresinden bize ulaşabilirsiniz.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;color:#525252;letter-spacing:1px;text-transform:uppercase;">
                &copy; ${new Date().getFullYear()} Dark Velvet &mdash; Premium Fashion
              </p>
              <p style="margin:0;font-size:11px;color:#404040;">
                Bu e-posta ${escapeHtml(orderNumber)} numaralı siparişiniz kapsamında gönderilmiştir.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Shipink üzerinden oluşturulan faturanın PDF linkini
 * premium tasarımlı bir HTML e-posta ile müşteriye gönderir.
 */
export async function sendShipinkInvoiceEmail(params: InvoiceEmailParams): Promise<void> {
  const { orderId, invoiceNumber, pdfUrl, ettn } = params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      shippingAddress: { select: { fullName: true } },
      billingAddress: { select: { fullName: true } },
    },
  });

  if (!order) {
    throw new Error(`[InvoiceEmail] Sipariş bulunamadı: ${orderId}`);
  }

  const customerName =
    order.user?.name ||
    order.billingAddress?.fullName ||
    order.shippingAddress?.fullName ||
    "Değerli Müşterimiz";

  const customerEmail =
    order.email ||
    order.user?.email;

  if (!customerEmail) {
    console.warn(`[InvoiceEmail] Müşteri e-postası bulunamadı. OrderId: ${orderId}`);
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "https://dark-velvet.com";
  const from = process.env.ORDER_MAIL_FROM || resendFromAddress();

  const html = buildInvoiceEmailHtml({
    customerName,
    orderNumber: order.orderNumber,
    invoiceNumber,
    ettn,
    totalAmount: order.total,
    pdfUrl,
    orderDate: formatDate(order.createdAt),
    siteUrl,
  });

  try {
    await resend.emails.send({
      from,
      to: customerEmail,
      subject: `Faturanız hazır — ${order.orderNumber}`,
      html,
    });

    await prisma.auditLog.create({
      data: {
        action: "FATURA_EMAIL_GONDERILDI",
        entityType: "ORDER",
        entityId: orderId,
        details: {
          to: customerEmail,
          invoiceNumber,
          ettn,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[InvoiceEmail] Mail gönderim hatası: ${message}`, { orderId, customerEmail });

    await prisma.auditLog.create({
      data: {
        action: "FATURA_EMAIL_HATASI",
        entityType: "ORDER",
        entityId: orderId,
        details: {
          to: customerEmail,
          invoiceNumber,
          error: message,
        },
      },
    });

    throw new Error(`Fatura e-postası gönderilemedi: ${message}`);
  }
}
