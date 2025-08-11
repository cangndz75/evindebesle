// app/blog/_components/BlogSidebar.tsx
import { Suspense } from "react";
import BlogCategoryList from "./BlogCategoryList";
import BlogGallery from "./BlogGallery";
import BlogRecentPosts from "./BlogRecentPosts";
import BlogSearchBox from "./BlogSearchBox";
import BlogTags from "./BlogTags";

export default function BlogSidebar() {
  return (
    <div className="space-y-10">
      <Suspense fallback={<div>Arama yükleniyor…</div>}>
        <BlogSearchBox />
      </Suspense>

      <Suspense fallback={<div>Son yazılar yükleniyor…</div>}>
        <BlogRecentPosts />
      </Suspense>

      <Suspense fallback={<div>Kategoriler yükleniyor…</div>}>
        <BlogCategoryList />
      </Suspense>

      <Suspense fallback={<div>Galeri yükleniyor…</div>}>
        <BlogGallery />
      </Suspense>

      <Suspense fallback={<div>Etiketler yükleniyor…</div>}>
        <BlogTags />
      </Suspense>
    </div>
  );
}
