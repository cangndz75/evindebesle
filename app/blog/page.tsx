// app/blog/page.tsx
import { Suspense } from "react";
import { getAllPosts } from "@/lib/blogData";
import BlogCard from "./_components/BlogCard";
import BlogSidebar from "./_components/BlogSidebar";
import BlogPagination from "./_components/BlogPagination";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 9;

// util
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
const uniqBySlug = <T extends { slug: string }>(arr: T[]) =>
  Array.from(new Map(arr.map((x) => [x.slug, x])).values());

function PaginationSkeleton() {
  return (
    <div className="flex justify-center gap-2">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-10" />
      <Skeleton className="h-9 w-10" />
      <Skeleton className="h-9 w-24" />
    </div>
  );
}

export default async function BlogHomePage({
  searchParams,
}: {
  searchParams?: { tag?: string; category?: string; q?: string; page?: string };
}) {
  const posts = await getAllPosts();

  // --- filtreler ---
  const tag = searchParams?.tag?.trim();
  const category = searchParams?.category?.trim();
  const q = searchParams?.q?.trim()?.toLowerCase();

  let filtered = posts.slice();

  if (tag) {
    const t = slugify(tag);
    filtered = filtered.filter((p) =>
      (p.tags ?? []).map(slugify).includes(t)
    );
  }

  if (category) {
    const c = slugify(category);
    filtered = filtered.filter((p) => slugify(p.category) === c);
  }

  if (q) {
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }

  // tekilleştir + tarihe göre sırala
  const uniqueSorted = uniqBySlug(filtered).sort(
    (a, b) => +new Date(b.date) - +new Date(a.date)
  );

  // --- sayfalama ---
  const pageNum = Math.max(1, parseInt(searchParams?.page || "1", 10) || 1);
  const start = (pageNum - 1) * PAGE_SIZE;
  const pageItems = uniqueSorted.slice(start, start + PAGE_SIZE);

  // dev’de çakışan slugları logla (opsiyonel)
  if (process.env.NODE_ENV !== "production") {
    const seen = new Set<string>();
    const dups: string[] = [];
    posts.forEach((p) => (seen.has(p.slug) ? dups.push(p.slug) : seen.add(p.slug)));
    if (dups.length) console.warn("Duplicate slugs:", dups);
  }

  return (
    <div className="container grid grid-cols-1 lg:grid-cols-12 gap-8 py-10">
      <div className="lg:col-span-8 space-y-10">
        {pageItems.length === 0 ? (
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            Sonuç bulunamadı. Filtreleri temizleyip tekrar deneyin.
          </div>
        ) : (
          pageItems.map((post) => (
            <BlogCard key={`${post.slug}-${post.date}`} post={post} />
          ))
        )}

        <Suspense fallback={<PaginationSkeleton />}>
          <BlogPagination />
        </Suspense>
      </div>

      <div className="lg:col-span-4">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          }
        >
          <BlogSidebar />
        </Suspense>
      </div>
    </div>
  );
}
