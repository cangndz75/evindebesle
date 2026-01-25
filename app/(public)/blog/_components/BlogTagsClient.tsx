"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Item = { label: string; slug: string; count: number };

export default function BlogTagsClient({
  items,
  totalCount,
}: { items: Item[]; totalCount: number }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = sp.get("tag") ?? "";

  const hrefFor = (slug?: string) => {
    const q = new URLSearchParams(sp.toString());
    if (!slug || active === slug) q.delete("tag");
    else q.set("tag", slug);
    q.delete("page");
    const qs = q.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  if (!items.length) return null;

  return (
    <div>
      <h3 className="mb-3 border-l-4 border-primary pl-2 text-lg font-semibold">Etiketler</h3>
      <div className="flex flex-wrap gap-2">
        <Link
          href={hrefFor(undefined)}
          className={[
            "px-3 py-1 rounded-full text-sm transition border",
            active === ""
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground hover:bg-muted/70 border-transparent",
          ].join(" ")}
        >
          Tümü <span className="opacity-80">({totalCount})</span>
        </Link>

        {items.map((t) => {
          const isActive = t.slug === active;
          return (
            <Link
              key={t.slug}
              href={hrefFor(t.slug)}
              className={[
                "px-3 py-1 rounded-full text-sm transition border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 border-transparent",
              ].join(" ")}
            >
              {t.label} <span className="opacity-80">({t.count})</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
