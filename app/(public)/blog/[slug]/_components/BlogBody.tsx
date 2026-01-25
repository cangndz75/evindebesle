"use client";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

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

  const components: Components = {
    h1: ({ children }) => (
      <h2 className="text-3xl md:text-4xl font-bold mt-6 mb-4">{children}</h2>
    ),
    h2: ({ children }) => (
      <h3 className="text-2xl md:text-3xl font-semibold mt-8 mb-3">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="relative overflow-hidden rounded-2xl bg-gray-900 text-gray-100 p-6 md:p-8 shadow-md">
        <span className="absolute -bottom-4 -right-2 text-gray-700/50 text-[120px] leading-none select-none">
          &rdquo;
        </span>
        <div className="italic">{children}</div>
      </blockquote>
    ),
    ul: ({ children }) => <ul className="list-disc pl-6 space-y-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,

    table: ({ children }) => (
      <div className="not-prose rounded-2xl border shadow-sm overflow-hidden my-6">
        <Table>{children}</Table>
      </div>
    ),
    thead: ({ children }) => <TableHeader className="bg-slate-50">{children}</TableHeader>,
    tbody: ({ children }) => <TableBody>{children}</TableBody>,
    tr: ({ children }) => (
      <TableRow className="[&:nth-child(even)]:bg-slate-50/50">{children}</TableRow>
    ),
    th: ({ children }) => (
      <TableHead className="whitespace-nowrap font-semibold text-slate-700">
        {children}
      </TableHead>
    ),
    td: ({ children }) => <TableCell className="align-top">{children}</TableCell>,

    code: (props) => {
      const inline = (props as any).inline as boolean | undefined;
      const { children } = props;
      if (inline) {
        return (
          <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
            {children}
          </code>
        );
      }
      return (
        <pre className="not-prose rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto">
          <code>{children}</code>
        </pre>
      );
    },

    hr: () => <hr className="my-8 border-slate-200" />,
  };

  return (
    <div className="prose prose-neutral md:prose-lg max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
