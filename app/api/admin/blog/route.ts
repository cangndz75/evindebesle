import { NextRequest, NextResponse } from "next/server";
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
        const { title, content, excerpt, coverImage, tags, isPublished, metaTitle, metaDescription } = body;

        // Slugify title
        let slug = title.toLowerCase()
            .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
            .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

        // Ensure unique slug
        let counter = 1;
        let originalSlug = slug;
        while (await prisma.blogPost.findUnique({ where: { slug } })) {
            slug = `${originalSlug}-${counter}`;
            counter++;
        }

        const post = await prisma.blogPost.create({
            data: {
                title,
                slug,
                content,
                excerpt,
                coverImage,
                isPublished: isPublished || false,
                publishedAt: isPublished ? new Date() : null,
                authorId: user.id,
                tags: tags || [],
                metaTitle,
                metaDescription,
            }
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("Blog Create Error:", error);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
