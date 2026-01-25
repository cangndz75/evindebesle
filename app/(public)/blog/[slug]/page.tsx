import { prisma } from "@/lib/db";
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getOptimizedCloudinaryUrl, getBlurPlaceholderUrl } from "@/lib/cloudinary";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({ where: { slug } });

    if (!post) {
        return { title: "Not Found" };
    }

    return {
        title: post.metaTitle || post.title,
        description: post.metaDescription || post.excerpt,
        openGraph: {
            images: post.coverImage ? [post.coverImage] : [],
        }
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({
        where: { slug },
        include: { author: { select: { name: true } } }
    });

    if (!post || (!post.isPublished && process.env.NODE_ENV === "production")) {
        notFound();
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        "headline": post.title,
                        "image": post.coverImage ? [post.coverImage] : [],
                        "datePublished": post.publishedAt?.toISOString(),
                        "dateModified": post.updatedAt?.toISOString(),
                        "author": [{
                            "@type": "Person",
                            "name": post.author.name
                        }]
                    })
                }}
            />
            <article className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="mb-8 text-center">
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex justify-center gap-2 mb-4">
                            {post.tags.map((tag: string) => (
                                <span key={tag} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">#{tag}</span>
                            ))}
                        </div>
                    )}
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>
                    <div className="flex items-center justify-center text-gray-500 gap-4">
                        {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{new Date(post.publishedAt).toLocaleDateString("tr-TR", { dateStyle: "long" })}</time>}
                        <span>yazar: {post.author.name}</span>
                    </div>
                </div>

                {post.coverImage && (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10 shadow-lg">
                        <Image
                            src={getOptimizedCloudinaryUrl(post.coverImage, 1200)}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                            placeholder="blur"
                            blurDataURL={getBlurPlaceholderUrl(post.coverImage)}
                        />
                    </div>
                )}

                <div className="prose prose-lg mx-auto prose-blue prose-img:rounded-xl">
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
            </article>
        </>
    );
}
