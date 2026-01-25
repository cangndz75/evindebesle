"use client";

import { usePathname } from "next/navigation";
import {
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Share2,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export default function ShareButtons({ title }: { title: string }) {
  const pathname = usePathname();
  const origin =
    BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const url = `${origin}${pathname}`;
  const enc = encodeURIComponent;

  const items = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      bg: "bg-[#1877F2]",
      Icon: Facebook,
    },
    {
      label: "Twitter",
      href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
      bg: "bg-[#1DA1F2]",
      Icon: Twitter,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      bg: "bg-[#0A66C2]",
      Icon: Linkedin,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${enc(`${title} ${url}`)}`,
      bg: "bg-[#25D366]",
      Icon: MessageCircle,
    },
  ] as const;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Bağlantı kopyalandı!");
    } catch {
      toast.error("Bağlantı kopyalanamadı.");
    }
  };

  const webShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        copyLink();
      }
    } catch {}
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-semibold">Paylaş:</span>

      {items.map(({ label, href, bg, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition ${bg} hover:opacity-90`}
          title={label}
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </a>
      ))}

      <button
        type="button"
        onClick={copyLink}
        aria-label="Bağlantıyı kopyala"
        title="Bağlantıyı kopyala"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
      >
        <LinkIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={webShare}
        aria-label="Paylaş"
        title="Paylaş"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white hover:opacity-90 transition"
      >
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
}
