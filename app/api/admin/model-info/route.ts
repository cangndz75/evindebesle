import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function GET() {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    try {
        const modelInfos = await prisma.modelInfo.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });

        return jsonNoStore(modelInfos);
    } catch (error) {
        console.error("Error fetching model info:", error);
        return jsonNoStore(
            { error: "Failed to fetch model info" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    try {
        const body = await request.json();
        const { title, height, size, gender } = body;

        if (!title || !height || !size) {
            return jsonNoStore(
                { error: "Title, height, and size are required" },
                { status: 400 }
            );
        }

        const modelInfo = await prisma.modelInfo.create({
            data: {
                title,
                height,
                size,
                gender,
                isActive: true,
            },
        });

        return jsonNoStore(modelInfo, { status: 201 });
    } catch (error) {
        console.error("Error creating model info:", error);
        return jsonNoStore(
            { error: "Failed to create model info" },
            { status: 500 }
        );
    }
}
