import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { code, subtotal } = await request.json();

        if (!code) {
            return NextResponse.json({ error: "Kupon kodu gerekli" }, { status: 400 });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code },
        });

        if (!coupon || !coupon.isActive) {
            return NextResponse.json({ error: "Geçersiz veya aktif olmayan kupon" }, { status: 400 });
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json({ error: "Kupon süresi dolmuş" }, { status: 400 });
        }

        if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
            return NextResponse.json({ error: "Kupon kullanım limitine ulaşmış" }, { status: 400 });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === "PERCENT") {
            discountAmount = (subtotal * coupon.value) / 100;
        } else {
            discountAmount = coupon.value;
        }

        // Ensure discount doesn't exceed subtotal
        if (discountAmount > subtotal) {
            discountAmount = subtotal;
        }

        return NextResponse.json({
            success: true,
            couponId: coupon.id,
            code: coupon.code,
            discountAmount,
            finalTotal: subtotal - discountAmount,
        });

    } catch (error: any) {
        console.error("Coupon validation error:", error);
        return NextResponse.json({ error: "Kupon sorgulanamadı" }, { status: 500 });
    }
}
