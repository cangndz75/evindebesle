type SmsSendResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

function normalizePhoneNumber(phone: string) {
  const trimmed = String(phone || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+9${digits}`;
  return `+${digits}`;
}

export async function sendAdminOrderPaidSms(params: {
  orderNumber: string;
  total?: number | null;
  orderId: string;
}) : Promise<SmsSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    return { ok: false, skipped: true, error: "TWILIO_ENV_MISSING" };
  }

  const to = normalizePhoneNumber(process.env.ADMIN_ORDER_SMS_TO || "");
  if (!to) {
    return { ok: false, skipped: true, error: "ADMIN_PHONE_MISSING" };
  }

  const totalText = typeof params.total === "number" ? `${params.total.toFixed(2)} TL` : "-";
  const body = `Yeni siparis odemesi alindi. Siparis No: #${params.orderNumber}, Tutar: ${totalText}, ID: ${params.orderId}`;

  const payload = new URLSearchParams({
    To: to,
    From: from,
    Body: body,
  });

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "SMS_SEND_FAILED");
    return { ok: false, error: err };
  }

  return { ok: true };
}
