import { prisma } from "./db";
import { BlogPost } from "./types";

function mapPrismaToBlogPost(post: any): BlogPost {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    content: post.content,
    imageUrl: post.coverImage || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1600",
    date: post.publishedAt ? post.publishedAt.toISOString().split("T")[0] : post.createdAt.toISOString().split("T")[0],
    author: post.author?.name || "Dark Velvet",
    tags: post.tags || [],
    category: post.category || "Genel",
  };
}

export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        isPublished: true,
      },
      include: {
        author: {
          select: { name: true }
        }
      },
      orderBy: {
        publishedAt: "desc",
      }
    });

    return posts.map(mapPrismaToBlogPost);
  } catch (error) {
    console.error("getAllPosts error:", error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const post = await prisma.blogPost.findUnique({
      where: {
        slug: slug,
      },
      include: {
        author: {
          select: { name: true }
        }
      }
    });

    if (!post) return null;
    return mapPrismaToBlogPost(post);
  } catch (error) {
    console.error("getPostBySlug error:", error);
    return null;
  }
}

export async function getRelatedPosts(
  slug: string,
  category: string,
  limit = 3
): Promise<BlogPost[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        isPublished: true,
        slug: { not: slug },
        category: category,
      },
      include: {
        author: {
          select: { name: true }
        }
      },
      take: limit,
      orderBy: {
        publishedAt: "desc",
      }
    });

    return posts.map(mapPrismaToBlogPost);
  } catch (error) {
    console.error("getRelatedPosts error:", error);
    return [];
  }
}

