import { getAllPosts } from "@/lib/blogData";
import BlogCategoryListClient from "./BlogCategoryListClient";

function slugify(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function BlogCategoryList() {
  const posts = await getAllPosts();

  const map = new Map<string, { name: string; slug: string; count: number }>();
  for (const p of posts) {
    const slug = slugify(p.category);
    map.set(slug, { name: p.category, slug, count: (map.get(slug)?.count ?? 0) + 1 });
  }
  const items = Array.from(map.values()).sort((a, b) => b.count - a.count);
  const totalCount = posts.length;

  return <BlogCategoryListClient items={items} totalCount={totalCount} />;
}
