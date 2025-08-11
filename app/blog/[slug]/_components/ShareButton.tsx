"use client";
import { usePathname } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export default function ShareButtons({ title }: { title: string }) {
  const pathname = usePathname();
  const url = `${BASE_URL}${pathname}`; // her zaman aynı taban → no hydration diff
  const enc = encodeURIComponent;

  const items = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      label: "Twitter",
      href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${enc(`${title} ${url}`)}`,
    },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="font-semibold">Paylaş:</span>
      {items.map((i) => (
        <a
          key={i.label}
          href={i.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white text-sm"
        >
          {i.label[0]}
        </a>
      ))}
    </div>
  );
}
