"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BlogSearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    setKeyword(sp.get("q") ?? "");
  }, [sp]);

  const runSearch = (value: string) => {
    const q = value.trim();
    const params = new URLSearchParams(sp.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page"); // sayfayı sıfırla
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    runSearch(keyword);
  };

  const clearSearch = () => {
    setKeyword("");
    runSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-muted p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Yazı ara (başlık, özet, içerik)..."
          className="flex-1"
        />
        {keyword ? (
          <Button type="button" size="icon" variant="ghost" onClick={clearSearch} aria-label="Aramayı temizle">
            <X className="w-4 h-4" />
          </Button>
        ) : null}
        <Button type="submit" size="icon" aria-label="Ara">
          <Search className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
