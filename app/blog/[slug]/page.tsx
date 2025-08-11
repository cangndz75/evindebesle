// app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BlogSidebar from "../_components/BlogSidebar";
import Breadcrumbs from "./_components/Breadcrumbs";
import BlogHero from "./_components/BlogHero";
import BlogBody from "./_components/BlogBody";
import TagList from "./_components/TagList";
import AuthorCard from "./_components/AuthorCard";
import RelatedPosts from "./_components/RelatedPosts";
import ShareButtons from "./_components/ShareButton";

import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blogData";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.evindebesle.com";

/* ---------- SSG: tüm yazılar için statik paramlar ---------- */
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

/* ---------- SEO metadata ---------- */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post)
    return {
      title: "Yazı bulunamadı | Evinde Besle",
      robots: { index: false, follow: true },
    };

  const url = `${SITE}/blog/${post.slug}`;
  const title = `${post.title} | Evinde Besle`;
  const description =
    (post.excerpt ?? "").slice(0, 160) ||
    "Evcil hayvan bakımı ve evde bakım rehberleri.";

  const image = post.imageUrl ?? `${SITE}/og-default.jpg`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: [{ url: image }],
      siteName: "Evinde Besle",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/* ---------- Sayfa ---------- */
type Props = { params: Promise<{ slug: string }> }; // projendeki Promise kalıbına uyduk

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return notFound();

  const related = await getRelatedPosts(post.slug, post.category);

  // JSON-LD: Article
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.imageUrl ? [post.imageUrl] : undefined,
    datePublished: post.date,
    dateModified: post.date,
    author: [{ "@type": "Organization", name: "Evinde Besle" }],
    publisher: { "@type": "Organization", name: "Evinde Besle" },
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
    articleSection: post.category,
    keywords: (post.tags ?? []).join(", "),
  };

  // JSON-LD: Breadcrumb
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <div className="container py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="mx-auto max-w-4xl px-5 md:px-10">
        <Breadcrumbs title={post.title} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <article className="bg-white rounded-2xl shadow-sm overflow-hidden mx-auto max-w-4xl">
            <BlogHero post={post} />
            <div className="p-5 md:p-10">
              <BlogBody markdown={post.content} />
              <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <TagList tags={post.tags} />
                <ShareButtons title={post.title} />
              </div>
            </div>
          </article>

          <AuthorCard
            name="Evinde Besle Editör Ekibi"
            bio="Pet bakımında günlük rutin, doğru beslenme ve davranış zenginleştirme üzerine yazıyoruz."
            avatarUrl="https://res.cloudinary.com/dlahfchej/image/upload/v1752619387/13_lmksmp.png"
          />

          <div className="mx-auto max-w-4xl px-5 md:px-10">
            <RelatedPosts posts={related} />
          </div>
        </div>

        <div className="lg:col-span-4">
          <BlogSidebar />
        </div>
      </div>
    </div>
  );
}
