import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { id } = await params;
    try {
        const body = await request.json();
        const { title, content, isActive } = body;

        const sizeNote = await prisma.sizeNote.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(content && { content }),
                ...(typeof isActive === "boolean" && { isActive }),
            },
        });

        return jsonNoStore(sizeNote);
    } catch (error) {
        console.error("Error updating size note:", error);
        return jsonNoStore(
            { error: "Failed to update size note" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { id } = await params;
    try {
        await prisma.sizeNote.delete({
            where: { id },
        });

        return jsonNoStore({ success: true });
    } catch (error) {
        console.error("Error deleting size note:", error);
        return jsonNoStore(
            { error: "Failed to delete size note" },
            { status: 500 }
        );
    }
}
