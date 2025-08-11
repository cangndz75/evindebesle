// app/blog/page.tsx
import { Suspense } from "react";
import { Home } from "lucide-react";
import { getAllPosts } from "@/lib/blogData";
import BlogCard from "./_components/BlogCard";
import BlogSidebar from "./_components/BlogSidebar";
import BlogPagination from "./_components/BlogPagination";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 9;

// helpers
const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

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

// Mobile header: breadcrumb + başlık
function BlogMobileHeader() {
  return (
    <div className="md:hidden rounded-xl bg-gradient-to-r from-primary/5 to-transparent">
      <div className="px-4 pt-4 pb-3">
        <nav className="flex items-center gap-1 text-xs">
          <Home className="w-4 h-4" />
          <span className="text-muted-foreground">Ana Sayfa</span>
          <span className="text-muted-foreground">›</span>
          <span className="font-semibold text-primary">Blog</span>
        </nav>
        <hr className="my-3 border-border" />
        <h1 className="text-2xl font-extrabold">Blog Yazıları</h1>
      </div>
    </div>
  );
}

export default async function BlogHomePage({
  searchParams,
}: {
  // Next.js'in beklediği geniş tip
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const posts = await getAllPosts();

  const tag = one(searchParams?.tag)?.trim();
  const category = one(searchParams?.category)?.trim();
  const q = one(searchParams?.q)?.trim()?.toLowerCase();

  let filtered = posts.slice();

  if (tag) {
    const t = slugify(tag);
    filtered = filtered.filter((p) => (p.tags ?? []).map(slugify).includes(t));
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

  const uniqueSorted = uniqBySlug(filtered).sort(
    (a, b) => +new Date(b.date) - +new Date(a.date)
  );

  // Dinamik sayfalama
  const totalPages = Math.max(1, Math.ceil(uniqueSorted.length / PAGE_SIZE));
  const pageNumRaw = Number(one(searchParams?.page) ?? "1") || 1;
  const pageNum = Math.min(Math.max(pageNumRaw, 1), totalPages);

  const start = (pageNum - 1) * PAGE_SIZE;
  const pageItems = uniqueSorted.slice(start, start + PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <BlogMobileHeader />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">
          {pageItems.length === 0 ? (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              Aramanızla eşleşen yazı bulunamadı. Filtreleri temizleyip yeniden
              deneyin.
            </div>
          ) : (
            pageItems.map((post) => (
              <BlogCard key={`${post.slug}-${post.date}`} post={post} />
            ))
          )}

          <Suspense fallback={<PaginationSkeleton />}>
            <BlogPagination totalPages={totalPages} />
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
    </div>
  );
}
