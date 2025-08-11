import { Suspense } from "react";
import { Home } from "lucide-react";
import { Metadata } from "next";
import Script from "next/script";

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

/* --- SEO: metadata (Next 15: searchParams Promise) --- */
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = (await searchParams) ?? {};
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.evindebesle.com";
  const canonicalUrl = `${baseUrl}/blog`;

  const tag = one(sp.tag)?.trim();
  const category = one(sp.category)?.trim();
  const q = one(sp.q)?.trim();

  let title = "Evcil Hayvan Bakım Blogu | Evinde Besle";
  let description =
    "Evcil hayvan bakımı, beslenme, sağlık ve eğitim konularında en güncel blog yazılarımızı keşfedin.";

  if (tag) {
    title = `${tag} Hakkında Blog Yazıları | Evinde Besle`;
    description = `${tag} ile ilgili en güncel blog yazılarını okuyun.`;
  } else if (category) {
    title = `${category} Kategorisi Blog Yazıları | Evinde Besle`;
    description = `${category} kategorisinde evcil hayvan bakımıyla ilgili yazılar.`;
  } else if (q) {
    title = `"${q}" Arama Sonuçları | Evinde Besle Blog`;
    description = `"${q}" ile ilgili blog sonuçlarını görüntüleyin.`;
  }

  // Filtre/arama sayfalarını index dışı bırakıyoruz
  const noIndex = !!q || !!tag || !!category;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: !noIndex, follow: true },
  };
}

/* --- Page (Next 15: searchParams Promise) --- */
export default async function BlogHomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const posts = await getAllPosts();
  const sp = (await searchParams) ?? {};

  const tag = one(sp.tag)?.trim();
  const category = one(sp.category)?.trim();
  const q = one(sp.q)?.trim()?.toLowerCase();

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

  const totalPages = Math.max(1, Math.ceil(uniqueSorted.length / PAGE_SIZE));
  const pageNumRaw = Number(one(sp.page) ?? "1") || 1;
  const pageNum = Math.min(Math.max(pageNumRaw, 1), totalPages);

  const start = (pageNum - 1) * PAGE_SIZE;
  const pageItems = uniqueSorted.slice(start, start + PAGE_SIZE);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.evindebesle.com";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Evinde Besle Blog",
    description:
      "Evcil hayvan bakımı, beslenme, sağlık ve eğitim konularında en güncel blog yazıları.",
    url: `${baseUrl}/blog`,
    blogPost: pageItems.map((post: any) => ({
      "@type": "BlogPosting",
      headline: post.title,
      image: post.image || `${baseUrl}/default-blog.jpg`,
      url: `${baseUrl}/blog/${post.slug}`,
      datePublished: post.date,
      dateModified: post.date,
      author: { "@type": "Organization", name: "Evinde Besle" },
      publisher: {
        "@type": "Organization",
        name: "Evinde Besle",
        logo: { "@type": "ImageObject", url: `${baseUrl}/logo.png` },
      },
      description: post.excerpt,
    })),
    mainEntityOfPage: {
      "@type": "ItemList",
      itemListElement: pageItems.map((post: any, index: number) => ({
        "@type": "ListItem",
        position: index + 1 + (pageNum - 1) * PAGE_SIZE,
        url: `${baseUrl}/blog/${post.slug}`,
      })),
      numberOfItems: pageItems.length,
    },
  };

  return (
    <>
      <Script
        id="ld-blog"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <BlogMobileHeader />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-10">
            {pageItems.length === 0 ? (
              <div className="rounded-xl border p-6 text-sm text-muted-foreground">
                Aramanızla eşleşen yazı bulunamadı. Filtreleri temizleyip
                yeniden deneyin.
              </div>
            ) : (
              pageItems.map((post: any) => (
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
    </>
  );
}
