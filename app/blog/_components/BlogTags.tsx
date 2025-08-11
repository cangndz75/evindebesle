import { getAllPosts } from "@/lib/blogData";
import BlogTagsClient from "./BlogTagsClient";

function slugify(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function BlogTags() {
  const posts = await getAllPosts();

  const map = new Map<string, { label: string; slug: string; count: number }>();
  for (const p of posts) {
    for (const t of p.tags ?? []) {
      const slug = slugify(t);
      map.set(slug, { label: t, slug, count: (map.get(slug)?.count ?? 0) + 1 });
    }
  }

  const items = Array.from(map.values()).sort((a, b) => b.count - a.count);
  const totalCount = posts.length;

  return <BlogTagsClient items={items} totalCount={totalCount} />;
}
