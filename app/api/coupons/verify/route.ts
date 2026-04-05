import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ valid: false, message: "Kupon kodu boÅŸ olamaz" }, { status: 400 });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code },
        });

        if (!coupon) {
            return NextResponse.json({ valid: false, message: "BÃ¶yle bir kupon yoktur" });
        }

        if (!coupon.isActive) {
            return NextResponse.json({ valid: false, message: "BÃ¶yle bir kupon yoktur" });
        }

        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
            return NextResponse.json({ valid: false, message: "BÃ¶yle bir kupon yoktur" });
        }

        if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
            return NextResponse.json({ valid: false, message: "BÃ¶yle bir kupon yoktur" });
        }

        return NextResponse.json({
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            value: coupon.value,
            description: coupon.description,
            categoryId: coupon.categoryId,
            gender: coupon.gender,
        });

    } catch (error) {
        console.error("Coupon Verify Error:", error);
        return NextResponse.json({ valid: false, message: "Sunucu hatasÄ±" }, { status: 500 });
    }
}
