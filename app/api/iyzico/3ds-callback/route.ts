const Iyzipay = require("iyzipay");
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const paymentId = formData.get("paymentId")?.toString();
    const conversationData = formData.get("conversationData")?.toString();
    const conversationId = formData.get("conversationId")?.toString();

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZIPAY_API_KEY!,
  secretKey: process.env.IYZIPAY_SECRET_KEY!,
  uri: process.env.IYZIPAY_BASE_URL || "https://sandbox-api.iyzipay.com",
});



    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      paymentId,
      conversationData,
    };

    return await new Promise((resolve) => {
    ;(iyzipay.threedsPayment as any).complete(request, (err: any, result: any) => {
        if (err || result.status !== "success") {
        const failHtml = `
            <html><body>
            <h2 style="color:red">Ödeme başarısız.</h2>
            <p>${result.errorMessage || "Bir hata oluştu."}</p>
            </body></html>`;
        resolve(new Response(failHtml, { headers: { "Content-Type": "text/html" } }));
        } else {
        const successHtml = `
            <html><body>
            <h2 style="color:green">Ödeme başarılı!</h2>
            <p>İşlem ID: ${result.paymentId}</p>
            </body></html>`;
        resolve(new Response(successHtml, { headers: { "Content-Type": "text/html" } }));
        }
    });
    });

  } catch (error) {
    console.error("Callback Hatası:", error);
    return new Response(
      `<html><body><h2 style="color:red">Sunucu hatası!</h2></body></html>`,
      { headers: { "Content-Type": "text/html" }, status: 500 }
    );
  }
}
