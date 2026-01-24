"use client";

import { Block } from "../../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CouponBlockInspectorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

export default function CouponBlockInspector({
  block,
  onUpdate,
}: CouponBlockInspectorProps) {
  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: { ...block.content, [key]: value },
    });
  };

  const updateStyle = (key: string, value: any) => {
    onUpdate({
      style: { ...block.style, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium text-gray-700">Kupon Kodu</Label>
        <Input
          value={block.content.couponCode || "{{coupon_code}}"}
          onChange={(e) => updateContent("couponCode", e.target.value)}
          placeholder="{{coupon_code}}"
          className="mt-1 font-mono"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Geçerlilik Metni</Label>
        <Input
          value={block.content.validityText || ""}
          onChange={(e) => updateContent("validityText", e.target.value)}
          placeholder="1 ay geçerli"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Border Rengi</Label>
        <Input
          type="color"
          value={block.style.borderColor || "#000000"}
          onChange={(e) => updateStyle("borderColor", e.target.value)}
          className="mt-1 h-10"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Arka Plan Rengi</Label>
        <Input
          type="color"
          value={block.style.backgroundColor || "#ffffff"}
          onChange={(e) => updateStyle("backgroundColor", e.target.value)}
          className="mt-1 h-10"
        />
      </div>
    </div>
  );
}
