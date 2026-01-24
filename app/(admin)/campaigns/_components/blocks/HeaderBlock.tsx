"use client";

import { Block } from "../../types";

interface HeaderBlockProps {
  block: Block;
}

export default function HeaderBlock({ block }: HeaderBlockProps) {
  const logoUrl = block.content.logoUrl || "";
  const menuLinks = block.content.menuLinks || [];
  const backgroundColor = block.style.backgroundColor || "#ffffff";
  const padding = block.style.padding || "20px";

  return (
    <div
      style={{
        backgroundColor,
        padding,
      }}
    >
      <div className="flex items-center justify-between">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8" />
        ) : (
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
        )}
        <div className="flex gap-4">
          {menuLinks.length > 0 ? (
            menuLinks.map((link: any, index: number) => (
              <a
                key={index}
                href={link.url || "#"}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                {link.text || "Link"}
              </a>
            ))
          ) : (
            <span className="text-sm text-gray-400">Menü linkleri ekleyin</span>
          )}
        </div>
      </div>
    </div>
  );
}
