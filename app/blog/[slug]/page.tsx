// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import BlogSidebar from "../_components/BlogSidebar";
import Breadcrumbs from "./_components/Breadcrumbs";
import BlogHero from "./_components/BlogHero";
import BlogBody from "./_components/BlogBody";
import TagList from "./_components/TagList";
import AuthorCard from "./_components/AuthorCard";
import RelatedPosts from "./_components/RelatedPosts";
import { getPostBySlug, getRelatedPosts } from "@/lib/blogData";
import ShareButtons from "./_components/ShareButton";

type Props = { params: Promise<{ slug: string }> }; // <-- Promise

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params; // <-- await
  const post = await getPostBySlug(slug);
  if (!post) return notFound();

  const related = await getRelatedPosts(post.slug, post.category);

  return (
    <div className="container py-8">
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
