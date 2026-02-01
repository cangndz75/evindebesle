import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const sizeGuides = await prisma.sizeGuide.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(sizeGuides);
    } catch (error) {
        console.error("Error fetching size guides:", error);
        return NextResponse.json(
            { error: "Failed to fetch size guides" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, imageUrl, content } = body;

        if (!title) {
            return NextResponse.json(
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

        return NextResponse.json(sizeGuide, { status: 201 });
    } catch (error) {
        console.error("Error creating size guide:", error);
        return NextResponse.json(
            { error: "Failed to create size guide" },
            { status: 500 }
        );
    }
}
