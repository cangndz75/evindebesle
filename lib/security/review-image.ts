import "server-only";

/** Yorum görselleri: SVG/GIF yok (stored XSS / animasyon abuse). */
const REVIEW_IMAGE_SIGNATURES: {
  mime: "image/jpeg" | "image/png" | "image/webp";
  magic: number[];
  offset?: number;
  extra?: { bytes: number[]; offset: number };
}[] = [
  { mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  { mime: "image/png", magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/webp", magic: [0x52, 0x49, 0x46, 0x46], extra: { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 } },
];

export const REVIEW_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const REVIEW_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ReviewImageMime = (typeof REVIEW_ALLOWED_MIME_TYPES)[number];

export function detectReviewImageMime(buf: Buffer): ReviewImageMime | null {
  for (const sig of REVIEW_IMAGE_SIGNATURES) {
    const off = sig.offset ?? 0;
    if (buf.length < off + sig.magic.length) continue;
    const matches = sig.magic.every((b, i) => buf[off + i] === b);
    if (!matches) continue;

    if (sig.extra) {
      const { bytes, offset } = sig.extra;
      if (buf.length < offset + bytes.length) continue;
      if (!bytes.every((b, i) => buf[offset + i] === b)) continue;
    }
    return sig.mime;
  }
  return null;
}

export function reviewMimeToExtension(mime: ReviewImageMime): ".jpg" | ".png" | ".webp" {
  switch (mime) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".jpg";
  }
}
