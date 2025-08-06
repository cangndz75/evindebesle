import { BlogPost } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Image
        src={post.imageUrl}
        alt={post.title}
        width={800}
        height={400}
        className="w-full h-64 object-cover"
      />
      <div className="p-6 space-y-3">
        <p className="text-sm text-muted-foreground">
          {post.author} • {new Date(post.date).toLocaleDateString()}
        </p>
        <h2 className="text-xl font-bold">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="text-muted-foreground">{post.excerpt}</p>
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center text-primary font-medium"
        >
          Continue Reading →
        </Link>
      </div>
    </div>
  );
}
