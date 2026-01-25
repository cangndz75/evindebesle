import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json({ error: "Geçersiz email adresi" }, { status: 400 });
        }

        // 2) Handle Subscriber
        await prisma.subscriber.upsert({
            where: { email },
            update: { isActive: true },
            create: { email, isActive: true },
        });

        return NextResponse.json({ success: true, message: "Bülten aboneliği başarılı" });
    } catch (error) {
        return NextResponse.json({ error: "Abonelik başarısız" }, { status: 500 });
    }
}
