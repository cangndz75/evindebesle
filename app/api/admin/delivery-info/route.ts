import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function GET() {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    try {
        const deliveryInfos = await prisma.deliveryInfo.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });

        return jsonNoStore(deliveryInfos);
    } catch (error) {
        console.error("Error fetching delivery info:", error);
        return jsonNoStore(
            { error: "Failed to fetch delivery info" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    try {
        const body = await request.json();
        const { title, content } = body;

        if (!title || !content) {
            return jsonNoStore(
                { error: "Title and content are required" },
                { status: 400 }
            );
        }

        const deliveryInfo = await prisma.deliveryInfo.create({
            data: {
                title,
                content,
                isActive: true,
            },
        });

        return jsonNoStore(deliveryInfo, { status: 201 });
    } catch (error) {
        console.error("Error creating delivery info:", error);
        return jsonNoStore(
            { error: "Failed to create delivery info" },
            { status: 500 }
        );
    }
}
