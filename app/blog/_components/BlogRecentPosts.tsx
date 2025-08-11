import { getAllPosts } from "@/lib/blogData";
import { BlogPost } from "@/lib/types";
import Link from "next/link";


function uniqBySlug(posts: BlogPost[]) {
  const seen = new Set<string>();
  return posts.filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });
}

export default async function BlogRecentPosts({ limit = 5 }: { limit?: number }) {
  const all = await getAllPosts();

  const recent = uniqBySlug(
    all
      .slice()
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
  ).slice(0, limit);

  return (
    <div>
      <h3 className="mb-4 border-l-4 border-primary pl-2 text-lg font-semibold">
        Son Yazılar
      </h3>
      <ul className="space-y-3">
        {recent.map((post, idx) => (
          <li key={`${post.slug}-${post.date}-${idx}`}>
            <Link
              href={`/blog/${post.slug}`}
              className="group block rounded-lg border border-transparent px-3 py-2 transition hover:border-muted-foreground/20 hover:bg-muted"
            >
              <div className="text-sm font-medium group-hover:underline">
                {post.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(post.date).toLocaleDateString("tr-TR")}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
