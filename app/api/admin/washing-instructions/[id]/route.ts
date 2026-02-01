import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { title, content, isActive } = body;

        const instruction = await prisma.washingInstruction.update({
            where: { id: params.id },
            data: {
                ...(title && { title }),
                ...(content && { content }),
                ...(typeof isActive === "boolean" && { isActive }),
            },
        });

        return NextResponse.json(instruction);
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
    { params }: { params: { id: string } }
) {
    try {
        await prisma.washingInstruction.delete({
            where: { id: params.id },
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
