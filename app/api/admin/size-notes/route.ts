import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function GET() {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    try {
        const sizeNotes = await prisma.sizeNote.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });

        return jsonNoStore(sizeNotes);
    } catch (error) {
        console.error("Error fetching size notes:", error);
        return jsonNoStore(
            { error: "Failed to fetch size notes" },
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

        const sizeNote = await prisma.sizeNote.create({
            data: {
                title,
                content,
                isActive: true,
            },
        });

        return jsonNoStore(sizeNote, { status: 201 });
    } catch (error) {
        console.error("Error creating size note:", error);
        return jsonNoStore(
            { error: "Failed to create size note" },
            { status: 500 }
        );
    }
}
