import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST: Stok bildirimi oluştur
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, variantId, email } = body;

        if (!productId || !email) {
            return NextResponse.json({ error: "productId ve email zorunlu" }, { status: 400 });
        }

        // E-posta format kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Geçersiz e-posta adresi" }, { status: 400 });
        }

        // Aynı ürün/varyant için bekleyen bildirim var mı kontrol et
        const existing = await prisma.stockAlert.findFirst({
            where: {
                productId,
                variantId: variantId || null,
                email,
                isNotified: false,
            },
        });

        if (existing) {
            return NextResponse.json({ success: true, message: "Zaten bildirim mevcut" });
        }

        // Yeni bildirim oluştur
        await prisma.stockAlert.create({
            data: {
                productId,
                variantId: variantId || null,
                email,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Stock alert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
