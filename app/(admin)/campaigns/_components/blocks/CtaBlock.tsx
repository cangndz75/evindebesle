"use client";

import { Block } from "../../types";

interface CtaBlockProps {
  block: Block;
}

export default function CtaBlock({ block }: CtaBlockProps) {
  const buttonText = block.content.buttonText || "Hemen Harca";
  const linkUrl = block.content.linkUrl || "#";
  const backgroundColor = block.style.backgroundColor || "#000000";
  const textColor = block.style.textColor || "#ffffff";
  const borderRadius = block.style.borderRadius || "4px";
  const padding = block.style.padding || "12px 24px";

  return (
    <div className="p-8 text-center">
      <a
        href={linkUrl}
        className="inline-block font-semibold"
        style={{
          backgroundColor,
          color: textColor,
          borderRadius,
          padding,
        }}
      >
        {buttonText}
      </a>
    </div>
  );
}
