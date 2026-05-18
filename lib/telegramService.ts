const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[TELEGRAM] Bot token veya chat ID eksik, mesaj gönderilemedi.");
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API: ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.error("[TELEGRAM_SERVICE_ERROR]", error);
  }
}

function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const TelegramTemplates = {
  newOrder: (data: {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    itemsCount: number;
  }) =>
    `🎉 <b>YENİ SİPARİŞ GELDİ!</b>

📦 <b>Sipariş No:</b> <code>${data.orderNumber}</code>
👤 <b>Müşteri:</b> ${data.customerName}
🛒 <b>Ürün Adedi:</b> ${data.itemsCount}
💰 <b>Tutar:</b> <b>${formatTRY(data.totalAmount)} ₺</b>

⚡ <i>Paneli kontrol etmeyi unutma!</i>`,

  newReview: (data: {
    productName: string;
    customerName: string;
    rating: number;
    comment: string;
  }) =>
    `⭐ <b>YENİ ÜRÜN YORUMU</b>

🛍️ <b>Ürün:</b> ${data.productName}
👤 <b>Müşteri:</b> ${data.customerName}
🌟 <b>Puan:</b> ${"⭐".repeat(data.rating)}

💬 <i>"${data.comment}"</i>

📝 <i>${data.rating >= 4 ? "Otomatik onaylandı." : "Admin panelinden onay bekliyor."}</i>`,

  newReturn: (data: {
    orderNumber: string;
    customerName: string;
    reason: string;
    itemsCount: number;
  }) =>
    `🔄 <b>YENİ İADE TALEBİ</b>

📦 <b>Sipariş No:</b> <code>${data.orderNumber}</code>
👤 <b>Müşteri:</b> ${data.customerName}
📋 <b>Sebep:</b> ${data.reason}
📦 <b>Ürün Sayısı:</b> ${data.itemsCount}

🔍 <i>Admin panelinden incelemeyi bekliyor.</i>`,
};
