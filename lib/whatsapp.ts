type WhatsAppSendResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

function normalizeToWhatsApp(phone: string): string {
  const trimmed = String(phone || "").trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `9${digits}`;
  return digits;
}

function buildOrderMessage(params: {
  orderNumber: string;
  total?: number | null;
  orderId: string;
  customerName?: string | null;
  itemCount?: number | null;
}): string {
  const totalText =
    typeof params.total === "number"
      ? `${params.total.toFixed(2)} TL`
      : "-";

  const lines = [
    `🛒 *Yeni Sipariş Ödemesi Alındı!*`,
    ``,
    `📦 Sipariş No: *#${params.orderNumber}*`,
    `💰 Tutar: *${totalText}*`,
  ];

  if (params.customerName) {
    lines.push(`👤 Müşteri: ${params.customerName}`);
  }

  if (typeof params.itemCount === "number" && params.itemCount > 0) {
    lines.push(`📋 Ürün Adedi: ${params.itemCount}`);
  }

  lines.push(
    ``,
    `🔗 Detay: ${process.env.NEXT_PUBLIC_BASE_URL || "https://www.dark-velvet.com"}/admin-orders/${params.orderId}`,
    ``,
    `⏰ ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`,
  );

  return lines.join("\n");
}

async function sendViaMetaCloudApi(
  to: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_META_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { ok: false, skipped: true, error: "WHATSAPP_META_ENV_MISSING" };
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "WHATSAPP_SEND_FAILED");
    return { ok: false, error: err };
  }

  return { ok: true };
}

async function sendViaTwilio(
  to: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    return { ok: false, skipped: true, error: "TWILIO_WHATSAPP_ENV_MISSING" };
  }

  const payload = new URLSearchParams({
    To: `whatsapp:+${to}`,
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    Body: message,
  });

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "TWILIO_WA_SEND_FAILED");
    return { ok: false, error: err };
  }

  return { ok: true };
}

export async function sendAdminOrderWhatsApp(params: {
  orderNumber: string;
  total?: number | null;
  orderId: string;
  customerName?: string | null;
  itemCount?: number | null;
}): Promise<WhatsAppSendResult> {
  const rawTo = process.env.ADMIN_WHATSAPP_TO || process.env.ADMIN_ORDER_SMS_TO || "";
  const to = normalizeToWhatsApp(rawTo);

  if (!to) {
    return { ok: false, skipped: true, error: "ADMIN_WHATSAPP_PHONE_MISSING" };
  }

  const message = buildOrderMessage(params);

  const provider = (process.env.WHATSAPP_PROVIDER || "meta").toLowerCase();

  if (provider === "twilio") {
    return sendViaTwilio(to, message);
  }

  const metaResult = await sendViaMetaCloudApi(to, message);

  if (metaResult.skipped && provider !== "meta") {
    return sendViaTwilio(to, message);
  }

  return metaResult;
}
