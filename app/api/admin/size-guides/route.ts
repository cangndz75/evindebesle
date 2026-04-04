import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function GET() {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    try {
        const sizeGuides = await prisma.sizeGuide.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });

        return jsonNoStore(sizeGuides);
    } catch (error) {
        console.error("Error fetching size guides:", error);
        return jsonNoStore(
            { error: "Failed to fetch size guides" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    try {
        const body = await request.json();
        const { title, imageUrl, content } = body;

        if (!title) {
            return jsonNoStore(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        const sizeGuide = await prisma.sizeGuide.create({
            data: {
                title,
                imageUrl,
                content,
                isActive: true,
            },
        });

        return jsonNoStore(sizeGuide, { status: 201 });
    } catch (error) {
        console.error("Error creating size guide:", error);
        return jsonNoStore(
            { error: "Failed to create size guide" },
            { status: 500 }
        );
    }
}
