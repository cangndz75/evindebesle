import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET: Single post
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
}

// PATCH: Update
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        const body = await req.json();

        const existingPost = await prisma.blogPost.findUnique({ where: { id } });
        if (!existingPost) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // If title is changing, we should probably update the slug too to match
        let newSlug = undefined;
        if (body.title && body.title !== existingPost.title) {
            const { generateBlogSlug } = await import("@/lib/slug");
            newSlug = generateBlogSlug(body.title, id);
        }

        const post = await prisma.blogPost.update({
            where: { id },
            data: {
                ...body,
                slug: newSlug,
                updatedAt: new Date(),
                publishedAt: (body.isPublished === true && !existingPost?.publishedAt) ? new Date() : undefined
            }
        });

        return NextResponse.json(post);

    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;
        await prisma.blogPost.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
