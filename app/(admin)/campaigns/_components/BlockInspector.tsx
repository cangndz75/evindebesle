"use client";

import { Block } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import HeaderBlockInspector from "./block-inspectors/HeaderBlockInspector";
import HeroBlockInspector from "./block-inspectors/HeroBlockInspector";
import CouponBlockInspector from "./block-inspectors/CouponBlockInspector";
import CtaBlockInspector from "./block-inspectors/CtaBlockInspector";
import TextBlockInspector from "./block-inspectors/TextBlockInspector";
import FooterBlockInspector from "./block-inspectors/FooterBlockInspector";
import ProductBlockInspector from "./block-inspectors/ProductBlockInspector";
import ImageBlockInspector from "./block-inspectors/ImageBlockInspector";
import DividerBlockInspector from "./block-inspectors/DividerBlockInspector";

interface BlockInspectorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

export default function BlockInspector({ block, onUpdate }: BlockInspectorProps) {
  const renderInspector = () => {
    switch (block.type) {
      case "header":
        return <HeaderBlockInspector block={block} onUpdate={onUpdate} />;
      case "hero":
        return <HeroBlockInspector block={block} onUpdate={onUpdate} />;
      case "coupon":
        return <CouponBlockInspector block={block} onUpdate={onUpdate} />;
      case "cta":
        return <CtaBlockInspector block={block} onUpdate={onUpdate} />;
      case "text":
        return <TextBlockInspector block={block} onUpdate={onUpdate} />;
      case "footer":
        return <FooterBlockInspector block={block} onUpdate={onUpdate} />;
      case "product":
        return <ProductBlockInspector block={block} onUpdate={onUpdate} />;
      case "image":
        return <ImageBlockInspector block={block} onUpdate={onUpdate} />;
      case "divider":
        return <DividerBlockInspector block={block} onUpdate={onUpdate} />;
      default:
        return <div className="p-4 text-gray-500">Bilinmeyen blok tipi</div>;
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          Blok Ayarları
        </h3>
        <p className="text-xs text-gray-500">{block.type}</p>
      </div>

      {/* Görünürlük Ayarları */}
      <div className="mb-4 space-y-3">
        <Label className="text-xs font-medium text-gray-700">Görünürlük</Label>
        <div className="flex items-center justify-between">
          <Label htmlFor="mobile-visibility" className="text-sm">
            Mobilde göster
          </Label>
          <Switch
            id="mobile-visibility"
            checked={block.visibility.mobile}
            onCheckedChange={(checked) =>
              onUpdate({
                visibility: { ...block.visibility, mobile: checked },
              })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="desktop-visibility" className="text-sm">
            Desktop'ta göster
          </Label>
          <Switch
            id="desktop-visibility"
            checked={block.visibility.desktop}
            onCheckedChange={(checked) =>
              onUpdate({
                visibility: { ...block.visibility, desktop: checked },
              })
            }
          />
        </div>
      </div>

      {/* Blok Tipine Özel Ayarlar */}
      <div className="border-t border-gray-200 pt-4">
        {renderInspector()}
      </div>
    </div>
  );
}
