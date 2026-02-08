import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ valid: false, message: "Kupon kodu boş olamaz" }, { status: 400 });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code },
        });

        // "Böyle bir kupon kodu bulunmamaktadır" is the requested generic error
        if (!coupon) {
            return NextResponse.json({ valid: false, message: "Böyle bir kupon kodu bulunmamaktadır" });
        }

        if (!coupon.isActive) {
            return NextResponse.json({ valid: false, message: "Böyle bir kupon kodu bulunmamaktadır" });
        }

        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
            return NextResponse.json({ valid: false, message: "Böyle bir kupon kodu bulunmamaktadır" }); // Expired treated as not found/invalid per request to be vague? Or strictly "expired"? plan said "Such a coupon code does not exist"
        }

        if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
            return NextResponse.json({ valid: false, message: "Böyle bir kupon kodu bulunmamaktadır" });
        }

        return NextResponse.json({
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            value: coupon.value,
            description: coupon.description, // e.g. "10% Welcome Discount"
        });

    } catch (error) {
        console.error("Coupon Verify Error:", error);
        return NextResponse.json({ valid: false, message: "Sunucu hatası" }, { status: 500 });
    }
}
