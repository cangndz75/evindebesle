import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function GET() {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    try {
        const instructions = await prisma.washingInstruction.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });

        return jsonNoStore(instructions);
    } catch (error) {
        console.error("Error fetching washing instructions:", error);
        return jsonNoStore(
            { error: "Failed to fetch washing instructions" },
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

        const instruction = await prisma.washingInstruction.create({
            data: {
                title,
                content,
                isActive: true,
            },
        });

        return jsonNoStore(instruction, { status: 201 });
    } catch (error) {
        console.error("Error creating washing instruction:", error);
        return jsonNoStore(
            { error: "Failed to create washing instruction" },
            { status: 500 }
        );
    }
}
