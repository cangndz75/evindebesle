"use client";

import { Block } from "../../types";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface TextBlockInspectorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

export default function TextBlockInspector({
  block,
  onUpdate,
}: TextBlockInspectorProps) {
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
        <Label className="text-xs font-medium text-gray-700">Metin İçeriği</Label>
        <Textarea
          value={block.content.text || ""}
          onChange={(e) => updateContent("text", e.target.value)}
          placeholder="Metin içeriği..."
          className="mt-1"
          rows={5}
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Font Boyutu</Label>
        <Input
          value={block.style.fontSize || "16px"}
          onChange={(e) => updateStyle("fontSize", e.target.value)}
          placeholder="16px"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Metin Rengi</Label>
        <Input
          type="color"
          value={block.style.textColor || "#333333"}
          onChange={(e) => updateStyle("textColor", e.target.value)}
          className="mt-1 h-10"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Padding</Label>
        <Input
          value={block.style.padding || "20px"}
          onChange={(e) => updateStyle("padding", e.target.value)}
          placeholder="20px"
          className="mt-1"
        />
      </div>
    </div>
  );
}
