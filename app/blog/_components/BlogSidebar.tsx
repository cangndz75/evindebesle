"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import BlogCategoryList from "./BlogCategoryList";
import BlogGallery from "./BlogGallery";
import BlogRecentPosts from "./BlogRecentPosts";
import BlogSearchBox from "./BlogSearchBox";
import BlogTags from "./BlogTags";

function SidebarSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full rounded-md" />
      ))}
    </div>
  );
}

export default function BlogSidebar() {
  return (
    <div className="space-y-10">
      <Suspense fallback={<SidebarSkeleton lines={1} />}>
        <BlogSearchBox />
      </Suspense>

      <Suspense fallback={<SidebarSkeleton lines={5} />}>
        <BlogRecentPosts />
      </Suspense>

      <Suspense fallback={<SidebarSkeleton lines={5} />}>
        <BlogCategoryList />
      </Suspense>

      <Suspense fallback={<SidebarSkeleton lines={3} />}>
        <BlogGallery />
      </Suspense>

      <Suspense fallback={<SidebarSkeleton lines={5} />}>
        <BlogTags />
      </Suspense>
    </div>
  );
}
