import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { getOptimizedCloudinaryUrl, getBlurPlaceholderUrl } from "@/lib/cloudinary";

export const metadata: Metadata = {
    title: "Blog - Evin De Besle",
    description: "Evcil hayvan bakımı, ipuçları ve rehberler.",
};

// Revalidate every hour
export const revalidate = 3600;

export default async function BlogPage() {
    const posts = await prisma.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        include: { author: { select: { name: true } } }
    });

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">Blog</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                    <Link href={`/blog/${post.slug}`} key={post.id} className="group">
                        <article className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white h-full flex flex-col">
                            <div className="relative h-48 w-full bg-gray-100">
                                {post.coverImage ? (
                                    <Image
                                        src={getOptimizedCloudinaryUrl(post.coverImage, 600)}
                                        alt={post.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        placeholder="blur"
                                        blurDataURL={getBlurPlaceholderUrl(post.coverImage)}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-300">
                                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center text-sm text-gray-500 mb-3">
                                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("tr-TR") : ""}</span>
                                    <span className="mx-2">•</span>
                                    <span>{post.author.name}</span>
                                </div>
                                <h2 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h2>
                                <p className="text-gray-600 line-clamp-3 mb-4 flex-1">
                                    {post.excerpt || post.content.substring(0, 150)}...
                                </p>
                                <div className="text-blue-600 font-medium text-sm flex items-center">
                                    Devamını Oku
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </article>
                    </Link>
                ))}
            </div>
        </div>
    );
}
