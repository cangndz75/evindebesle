"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Cat = { name: string; slug: string; count: number };

export default function BlogCategoryListClient({
  items,
  totalCount,
}: { items: Cat[]; totalCount: number }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = sp.get("category") ?? "";

  const hrefFor = (slug?: string) => {
    const q = new URLSearchParams(sp.toString());
    if (!slug || active === slug) q.delete("category"); 
    else q.set("category", slug);
    q.delete("page");
    const qs = q.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div>
      <h3 className="mb-4 border-l-4 border-primary pl-2 text-lg font-semibold">Kategoriler</h3>
      <ul className="space-y-2">
        <li>
          <Link
            href={hrefFor(undefined)}
            className={[
              "group flex items-center justify-between rounded-lg border px-3 py-2 transition",
              active === ""
                ? "border-primary/40 bg-primary/5"
                : "border-transparent hover:border-muted-foreground/20 hover:bg-muted",
            ].join(" ")}
          >
            <span className={active === "" ? "font-semibold" : "font-medium"}>Tümü</span>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-xs",
                active === "" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              {totalCount}
            </span>
          </Link>
        </li>

        {items.map((cat) => {
          const isActive = active === cat.slug;
          return (
            <li key={cat.slug} className="text-sm">
              <Link
                href={hrefFor(cat.slug)}
                className={[
                  "group flex items-center justify-between rounded-lg border px-3 py-2 transition",
                  isActive
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:border-muted-foreground/20 hover:bg-muted",
                ].join(" ")}
              >
                <span className={isActive ? "font-semibold" : "font-medium"}>{cat.name}</span>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  ].join(" ")}
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
