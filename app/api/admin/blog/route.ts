import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET: List blogs
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        // Allow public access for published blogs? Or this is admin route?
        // Route path says /admin/blog, so restrict to admin.
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const posts = await prisma.blogPost.findMany({
            orderBy: { createdAt: "desc" },
            include: { author: { select: { name: true, email: true } } }
        });

        return NextResponse.json(posts);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}

// POST: Create blog
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, content, excerpt, coverImage, tags, isPublished, metaTitle, metaDescription, category } = body;

        // Generate a temporary ID or use a placeholder to create
        // Actually we can create first then update slug to be safe with CUID
        const post = await prisma.blogPost.create({
            data: {
                title,
                slug: `temp-${Date.now()}`, // Temporary unique slug
                content,
                excerpt,
                coverImage,
                isPublished: isPublished || false,
                publishedAt: isPublished ? new Date() : null,
                authorId: user.id,
                tags: tags || [],
                metaTitle,
                metaDescription,
                category,
            }
        });

        // Generate the real slug using the actual ID
        const { generateBlogSlug } = await import("@/lib/slug");
        const finalSlug = generateBlogSlug(title, post.id);

        // Update the post with the real slug
        const updatedPost = await prisma.blogPost.update({
            where: { id: post.id },
            data: { slug: finalSlug }
        });

        return NextResponse.json(updatedPost);

    } catch (error) {
        console.error("Blog Create Error:", error);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
