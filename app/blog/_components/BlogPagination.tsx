// app/blog/_components/BlogPagination.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = { totalPages: number };

export default function BlogPagination({ totalPages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1 sayfadan azsa gizle
  if (!totalPages || totalPages <= 1) return null;

  const raw = Number(searchParams.get("page") || "1");
  const currentPage = Math.min(Math.max(raw, 1), totalPages);

  const changePage = (page: number) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("page", String(page));
    router.push(`/blog?${params.toString()}`);
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-2 pt-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => changePage(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="icon"
          onClick={() => changePage(page)}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="outline"
        size="icon"
        onClick={() => changePage(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
