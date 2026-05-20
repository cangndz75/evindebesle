import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { rateLimit } from "@/lib/rateLimit";
import {
  StockNotificationError,
  resolveNotificationVariantId,
  subscribeStockNotification,
} from "@/lib/services/stock-back-in-stock";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const { success } = await rateLimit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authConfig);
    const body = await req.json();
    const { productId, email, variantId, colorId, sizeId } = body;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Ürün bilgisi eksik." }, { status: 400 });
    }

    const resolvedEmail =
      typeof email === "string" && email.trim()
        ? email
        : session?.user?.email;

    if (!resolvedEmail) {
      return NextResponse.json(
        { error: "E-posta adresi gerekli." },
        { status: 400 }
      );
    }

    let resolvedVariantId: string | null =
      typeof variantId === "string" ? variantId : null;

    if (!resolvedVariantId && (colorId || sizeId)) {
      resolvedVariantId = await resolveNotificationVariantId(productId, {
        colorId: typeof colorId === "string" ? colorId : null,
        sizeId: typeof sizeId === "string" ? sizeId : null,
      });
    }

    const result = await subscribeStockNotification({
      productId,
      email: resolvedEmail,
      variantId: resolvedVariantId,
      userId: session?.user?.id ?? null,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof StockNotificationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[STOCK_NOTIFICATION_SUBSCRIBE]", error);
    return NextResponse.json(
      { error: "Bildirim kaydedilemedi." },
      { status: 500 }
    );
  }
}
