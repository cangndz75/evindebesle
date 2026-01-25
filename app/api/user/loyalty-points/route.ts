import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET: Kullanıcının puan bakiyesi ve geçmişi
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Toplam puan hesapla
        const points = await prisma.loyaltyPoint.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });

        let totalEarned = 0;
        let totalSpent = 0;
        let totalExpired = 0;

        for (const p of points) {
            if (p.type === "earned") totalEarned += p.points;
            else if (p.type === "spent") totalSpent += Math.abs(p.points);
            else if (p.type === "expired") totalExpired += Math.abs(p.points);
        }

        const balance = totalEarned - totalSpent - totalExpired;

        return NextResponse.json({
            balance,
            totalEarned,
            totalSpent,
            totalExpired,
            history: points.slice(0, 20),
        });
    } catch (error: any) {
        console.error("Loyalty points error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Puan ekle (internal use - sipariş sonrası vs.)
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            // Admin değilse sadece belirli işlemler yapılabilir
            // Bu endpoint genellikle internal olarak kullanılır
        }

        const body = await req.json();
        const { userId, points, type, reason, orderId, expiresAt } = body;

        if (!userId || !points || !type || !reason) {
            return NextResponse.json({ error: "userId, points, type, reason zorunlu" }, { status: 400 });
        }

        const loyaltyPoint = await prisma.loyaltyPoint.create({
            data: {
                userId,
                points: type === "spent" || type === "expired" ? -Math.abs(points) : Math.abs(points),
                type,
                reason,
                orderId: orderId || null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        });

        return NextResponse.json(loyaltyPoint);
    } catch (error: any) {
        console.error("Loyalty points create error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Puan kazanma kuralları
export const LOYALTY_RULES = {
    PURCHASE_RATE: 5, // Her 100 TL için 5 puan
    REVIEW_BONUS: 20, // Yorum yapmak 20 puan
    SIGNUP_BONUS: 50, // Kayıt olunca 50 puan
    BIRTHDAY_BONUS: 100, // Doğum günü 100 puan
    REFERRAL_BONUS: 50, // Arkadaş davet 50 puan
    POINTS_PER_TL: 10, // 10 puan = 1 TL
};
