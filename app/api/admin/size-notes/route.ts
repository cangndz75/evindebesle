import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const sizeNotes = await prisma.sizeNote.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(sizeNotes);
    } catch (error) {
        console.error("Error fetching size notes:", error);
        return NextResponse.json(
            { error: "Failed to fetch size notes" },
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

        const sizeNote = await prisma.sizeNote.create({
            data: {
                title,
                content,
                isActive: true,
            },
        });

        return NextResponse.json(sizeNote, { status: 201 });
    } catch (error) {
        console.error("Error creating size note:", error);
        return NextResponse.json(
            { error: "Failed to create size note" },
            { status: 500 }
        );
    }
}
