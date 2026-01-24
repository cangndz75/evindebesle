"use client";

import { Block } from "../../types";

interface FooterBlockProps {
  block: Block;
}

export default function FooterBlock({ block }: FooterBlockProps) {
  const siteLink = block.content.siteLink || "#";
  const supportEmail = block.content.supportEmail || "";
  const address = block.content.address || "";
  const socialLinks = block.content.socialLinks || [];
  const backgroundColor = block.style.backgroundColor || "#f9fafb";

  return (
    <div style={{ backgroundColor }} className="p-8 text-center text-sm text-gray-600">
      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          <a href={siteLink} className="hover:text-gray-900">
            Site
          </a>
          {supportEmail && (
            <a href={`mailto:${supportEmail}`} className="hover:text-gray-900">
              Destek
            </a>
          )}
        </div>
        {socialLinks.length > 0 && (
          <div className="flex justify-center gap-4">
            {socialLinks.map((link: any, index: number) => (
              <a key={index} href={link.url || "#"} className="hover:text-gray-900">
                {link.text || "Link"}
              </a>
            ))}
          </div>
        )}
        {address && <p className="text-xs">{address}</p>}
        <div className="text-xs space-y-1">
          <a href="/kvkk" className="hover:underline">KVKK</a>
          <span> • </span>
          <a href="/unsubscribe" className="hover:underline">Abonelikten Çık</a>
        </div>
      </div>
    </div>
  );
}
