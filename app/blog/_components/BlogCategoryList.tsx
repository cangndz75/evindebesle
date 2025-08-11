"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { getAllPosts } from "@/lib/blogData";

export default function BlogCategoryList() {
  const [categories, setCategories] = useState<
    { name: string; count: number }[]
  >([]);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const active = searchParams.get("category") ?? "";

  useEffect(() => {
    (async () => {
      const posts = await getAllPosts();
      const counts: Record<string, number> = {};

      posts.forEach((post) => {
        counts[post.category] = (counts[post.category] || 0) + 1;
      });

      setCategories(
        Object.entries(counts).map(([name, count]) => ({ name, count }))
      );
    })();
  }, []);

  return (
    <div>
      <h3 className="mb-4 border-l-4 border-primary pl-2 text-lg font-semibold">
        Kategoriler
      </h3>
      <ul className="space-y-2">
        {categories.map((cat) => {
          const isActive = active === cat.name;
          return (
            <li key={cat.name} className="text-sm">
              <Link
                href={`${pathname}?category=${encodeURIComponent(cat.name)}`}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 transition ${
                  isActive
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:border-muted-foreground/20 hover:bg-muted"
                }`}
              >
                <span className={isActive ? "font-semibold" : "font-medium"}>
                  {cat.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {cat.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
