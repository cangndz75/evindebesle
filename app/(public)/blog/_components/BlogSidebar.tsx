// app/blog/_components/BlogSidebar.tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import BlogCategoryList from "./BlogCategoryList"; // client (useSearchParams), async değil
import BlogGallery from "./BlogGallery";           // client/server fark etmez
import BlogRecentPosts from "./BlogRecentPosts";   // server (yukarıdaki)
import BlogSearchBox from "./BlogSearchBox";       // client (useSearchParams), async değil
import BlogTags from "./BlogTags";

function Lines({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

export default function BlogSidebar() {
  return (
    <div className="space-y-10">
      <Suspense fallback={<Lines n={1} />}>
        <BlogSearchBox />
      </Suspense>

      <Suspense fallback={<Lines n={5} />}>
        <BlogRecentPosts />
      </Suspense>

      <Suspense fallback={<Lines n={5} />}>
        <BlogCategoryList />
      </Suspense>

      <Suspense fallback={<Lines n={3} />}>
        <BlogGallery />
      </Suspense>

      <Suspense fallback={<Lines n={5} />}>
        <BlogTags />
      </Suspense>
    </div>
  );
}
