"use client";

import { Block } from "../../types";

interface HeroBlockProps {
  block: Block;
}

export default function HeroBlock({ block }: HeroBlockProps) {
  const imageUrl = block.content.imageUrl || "";
  const message = block.content.message || "";
  const greeting = block.content.greeting || "";
  const description = block.content.description || "";
  const backgroundColor = block.style.backgroundColor || "#f9fafb";

  return (
    <div style={{ backgroundColor }}>
      {imageUrl && (
        <div className="w-full">
          <img src={imageUrl} alt="Hero" className="w-full h-auto" />
        </div>
      )}
      <div className="p-8 text-center">
        {message && (
          <p className="text-sm text-gray-600 mb-4">{message}</p>
        )}
        {greeting && (
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{greeting}</h2>
        )}
        {description && (
          <p className="text-gray-700">{description}</p>
        )}
        {!imageUrl && !message && !greeting && !description && (
          <p className="text-gray-400 text-sm">Hero banner içeriği ekleyin</p>
        )}
      </div>
    </div>
  );
}
