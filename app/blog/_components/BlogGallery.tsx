import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/blogData";

const FALLBACK =
  "https://res.cloudinary.com/dlahfchej/image/upload/v1752619387/13_lmksmp.png";

export default async function BlogGallery({ limit = 6 }: { limit?: number }) {
  const posts = await getAllPosts();

  const sorted = posts
    .slice()
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const unique = Array.from(new Map(sorted.map((p) => [p.slug, p])).values());

  const items = unique.filter((p) => p.imageUrl).slice(0, limit);

  if (!items.length) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 border-l-4 pl-2 border-primary">
        Galeri
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {items.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group relative block aspect-square overflow-hidden rounded-md ring-1 ring-slate-200"
          >
            <Image
              src={post.imageUrl || FALLBACK}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 33vw, 80px"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
