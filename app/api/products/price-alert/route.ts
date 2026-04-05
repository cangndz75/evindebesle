import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, email, targetPrice, currentPrice } = body;

        if (!productId || !email) {
            return NextResponse.json({ error: "productId ve email zorunlu" }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Geçersiz e-posta adresi" }, { status: 400 });
        }

        const existing = await prisma.priceAlert.findFirst({
            where: {
                productId,
                email,
                isNotified: false,
            },
        });

        if (existing) {
            await prisma.priceAlert.update({
                where: { id: existing.id },
                data: {
                    targetPrice: targetPrice || null,
                    currentPrice,
                },
            });
            return NextResponse.json({ success: true, message: "Bildirim güncellendi" });
        }

        await prisma.priceAlert.create({
            data: {
                productId,
                email,
                targetPrice: targetPrice || null,
                currentPrice,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Price alert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
