"use client";

import { Block } from "../../types";

interface TextBlockProps {
  block: Block;
}

export default function TextBlock({ block }: TextBlockProps) {
  const text = block.content.text || "";
  const fontSize = block.style.fontSize || "16px";
  const textColor = block.style.textColor || "#333333";
  const padding = block.style.padding || "20px";

  return (
    <div style={{ padding, fontSize, color: textColor }}>
      {text || (
        <p className="text-gray-400 italic">Metin içeriği ekleyin</p>
      )}
    </div>
  );
}
