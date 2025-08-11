"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BlogBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-neutral md:prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-4xl font-extrabold mt-6 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold mt-8 mb-3">{children}</h2>
          ),
          blockquote: ({ children }) => (
            <blockquote className="bg-gray-900 text-gray-200 italic border-l-4 border-primary p-6 rounded-xl shadow-md">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-2">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
