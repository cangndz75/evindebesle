import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const instructions = await prisma.washingInstruction.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(instructions);
    } catch (error) {
        console.error("Error fetching washing instructions:", error);
        return NextResponse.json(
            { error: "Failed to fetch washing instructions" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json(
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

        return NextResponse.json(instruction, { status: 201 });
    } catch (error) {
        console.error("Error creating washing instruction:", error);
        return NextResponse.json(
            { error: "Failed to create washing instruction" },
            { status: 500 }
        );
    }
}
