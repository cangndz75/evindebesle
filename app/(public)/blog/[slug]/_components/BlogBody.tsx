"use client";



import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BlogBody({ markdown }: { markdown: string }) {
  const cleaned = markdown.replace(/^\s*# .*\n+/, "");



  return (
    <div className="prose prose-neutral md:prose-lg max-w-none">
      <div
        dangerouslySetInnerHTML={{ __html: cleaned }}
      />
    </div>
  );
}
