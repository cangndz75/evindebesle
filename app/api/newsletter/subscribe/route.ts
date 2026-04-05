import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json({ error: "GeÃ§ersiz email adresi" }, { status: 400 });
        }

        await prisma.subscriber.upsert({
            where: { email },
            update: { isActive: true },
            create: { email, isActive: true },
        });

        return NextResponse.json({ success: true, message: "BÃ¼lten aboneliÄŸi baÅŸarÄ±lÄ±" });
    } catch (error) {
        return NextResponse.json({ error: "Abonelik baÅŸarÄ±sÄ±z" }, { status: 500 });
    }
}
