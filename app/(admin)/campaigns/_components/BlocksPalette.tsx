"use client";

import { Image, Gift, MousePointerClick, FileText, Layout, ShoppingBag, ImageIcon, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlockType } from "../types";

interface BlocksPaletteProps {
  onSelectBlock: (blockType: BlockType) => void;
}

const blockTypes: Array<{
  type: BlockType;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
    {
      type: "header",
      label: "Header",
      icon: <Layout className="w-4 h-4" />,
      description: "Logo ve menü linkleri",
    },
    {
      type: "hero",
      label: "Hero Banner",
      icon: <Image className="w-4 h-4" />,
      description: "Büyük banner görseli",
    },
    {
      type: "product",
      label: "Ürün Grid",
      icon: <ShoppingBag className="w-4 h-4" />,
      description: "Ürün kartları (2/3/4 sütun)",
    },
    {
      type: "image",
      label: "Görsel",
      icon: <ImageIcon className="w-4 h-4" />,
      description: "Tek görsel bloğu",
    },
    {
      type: "coupon",
      label: "Kupon Bloğu",
      icon: <Gift className="w-4 h-4" />,
      description: "İndirim kuponu",
    },
    {
      type: "cta",
      label: "CTA Button",
      icon: <MousePointerClick className="w-4 h-4" />,
      description: "Aksiyon butonu",
    },
    {
      type: "text",
      label: "Metin",
      icon: <FileText className="w-4 h-4" />,
      description: "Paragraf metni",
    },
    {
      type: "divider",
      label: "Ayırıcı",
      icon: <Minus className="w-4 h-4" />,
      description: "Bölüm ayırıcı çizgi",
    },
    {
      type: "footer",
      label: "Footer",
      icon: <Layout className="w-4 h-4" />,
      description: "Alt bilgi ve linkler",
    },
  ];

export default function BlocksPalette({ onSelectBlock }: BlocksPaletteProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-700 mb-3">Blok Tipleri</h3>
      {blockTypes.map((block) => (
        <Button
          key={block.type}
          variant="outline"
          className="w-full justify-start text-left h-auto py-3"
          onClick={() => onSelectBlock(block.type)}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{block.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-sm">{block.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {block.description}
              </div>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}
