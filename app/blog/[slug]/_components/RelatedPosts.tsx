// app/blog/[slug]/_components/RelatedPosts.tsx
import Link from "next/link";
import Image from "next/image";
import { BlogPost } from "@/lib/types";

export default function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;

  return (
    <section className="mx-auto max-w-4xl mt-10 px-5 md:px-10">
      <h3 className="text-xl font-bold mb-4">Benzer Yazılar</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group rounded-2xl overflow-hidden border bg-white hover:shadow-md transition"
          >
            <div className="relative h-40">
              <Image
                src={p.imageUrl}
                alt={p.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h4 className="font-semibold line-clamp-2 group-hover:underline">
                {p.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {p.excerpt}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
