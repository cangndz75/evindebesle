import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isAdmin = searchParams.get("admin") === "true";

    try {
        if (isAdmin) {
            const session = await getServerSession(authConfig);
            if (!session?.user?.isAdmin) {
                return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
            }
        }

        const where: any = isAdmin ? {} : { isActive: true };
        if (category) {
            where.category = category;
        }

        const faqs = await prisma.fAQ.findMany({
            where,
            orderBy: [{ category: "asc" }, { order: "asc" }],
        });

        if (!isAdmin) {
            const grouped: Record<string, typeof faqs> = {};
            for (const faq of faqs) {
                if (!grouped[faq.category]) {
                    grouped[faq.category] = [];
                }
                grouped[faq.category].push(faq);
            }
            return NextResponse.json({ grouped, faqs });
        }

        return NextResponse.json({ faqs });
    } catch (error: any) {
        console.error("FAQ fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const body = await req.json();
        const { question, answer, category, order, isActive } = body;

        if (!question || !answer || !category) {
            return NextResponse.json({ error: "Soru, cevap ve kategori zorunlu" }, { status: 400 });
        }

        const faq = await prisma.fAQ.create({
            data: {
                question,
                answer,
                category,
                order: order || 0,
                isActive: isActive !== false,
            },
        });

        return NextResponse.json(faq);
    } catch (error: any) {
        console.error("FAQ create error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "ID zorunlu" }, { status: 400 });
        }

        const faq = await prisma.fAQ.update({
            where: { id },
            data: updates,
        });

        return NextResponse.json(faq);
    } catch (error: any) {
        console.error("FAQ update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID zorunlu" }, { status: 400 });
        }

        await prisma.fAQ.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("FAQ delete error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
