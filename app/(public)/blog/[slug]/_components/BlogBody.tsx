"use client";



import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { sanitizeHtmlForRender } from "@/lib/security/sanitizeHtml";

export default function BlogBody({ markdown }: { markdown: string }) {
  const cleaned = markdown.replace(/^\s*# .*\n+/, "");
  const sanitized = sanitizeHtmlForRender(cleaned);



  return (
    <div className="prose prose-neutral md:prose-lg max-w-none">
      <div
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    </div>
  );
}
