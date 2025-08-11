import { BlogPost } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export default function BlogCard({ post }: { post: BlogPost }) {
  const date = new Date(post.date);
  return (
    <article className="bg-white rounded-xl shadow-sm overflow-hidden mx-auto max-w-4xl">
      <Link href={`/blog/${post.slug}`} className="block">
        <Image
          src={post.imageUrl}
          alt={post.title}
          width={1200}
          height={600}
          className="w-full h-48 md:h-72 lg:h-80 object-cover"
          priority
        />
      </Link>

      <div className="p-4 md:p-8">
        <p className="hidden md:block text-sm text-muted-foreground mb-3">
          {post.author} •{" "}
          {date.toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>

        {/* Başlık */}
        <h2 className="font-extrabold leading-tight">
          <Link
            href={`/blog/${post.slug}`}
            className="block text-lg md:text-4xl lg:text-[2.6rem] md:tracking-tight
                       line-clamp-2 md:line-clamp-none"
          >
            {post.title}
          </Link>
        </h2>

        <p
          className="mt-2 md:mt-4 text-sm md:text-base text-muted-foreground
                     line-clamp-2 md:line-clamp-none md:leading-relaxed"
        >
          {post.excerpt}
        </p>

        <div className="mt-3 md:mt-6">
          <Link
            href={`/blog/${post.slug}`}
            className="md:hidden inline-flex items-center text-primary font-medium text-sm"
          >
            Devamını oku →
          </Link>
          <Link
            href={`/blog/${post.slug}`}
            className="hidden md:inline-flex items-center gap-2 text-primary font-semibold"
          >
            Devamını Oku <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
