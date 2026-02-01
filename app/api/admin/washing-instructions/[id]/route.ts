import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { title, content, isActive } = body;

        const washingInstruction = await prisma.washingInstruction.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(content && { content }),
                ...(typeof isActive === "boolean" && { isActive }),
            },
        });

        return NextResponse.json(washingInstruction);
    } catch (error) {
        console.error("Error updating washing instruction:", error);
        return NextResponse.json(
            { error: "Failed to update washing instruction" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.washingInstruction.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting washing instruction:", error);
        return NextResponse.json(
            { error: "Failed to delete washing instruction" },
            { status: 500 }
        );
    }
}
