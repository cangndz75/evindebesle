// app/blog/_components/BlogRecentPosts.tsx
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getAllPosts } from "@/lib/blogData";

export default async function BlogRecentPosts() {
  const posts = await getAllPosts();

  const sorted = posts
    .slice()
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  // slug'a göre tekilleştir
  const unique = Array.from(new Map(sorted.map((p) => [p.slug, p])).values());

  const recent = unique.slice(0, 3);

  return (
    <section aria-labelledby="recent-posts-heading">
      <div className="mb-5">
        <h3
          id="recent-posts-heading"
          className="text-lg font-semibold text-slate-800"
        >
          Son Yazılar
        </h3>
        <div className="mt-2 h-[3px] w-14 rounded-full bg-indigo-600" />
      </div>

      <ul className="space-y-6">
        {recent.map((post, idx) => {
          const dateStr = format(new Date(post.date), "dd MMM, yyyy", {
            locale: tr,
          });
          return (
            <li key={`${post.slug}-${idx}`}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex gap-4 items-start"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200">
                  <Image
                    src={
                      post.imageUrl ||
                      "https://res.cloudinary.com/dlahfchej/image/upload/v1752619387/13_lmksmp.png"
                    }
                    alt={post.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    {dateStr}
                  </div>
                  <h4 className="mt-1 text-sm font-semibold leading-5 text-slate-700 line-clamp-2 group-hover:text-indigo-600">
                    {post.title}
                  </h4>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
