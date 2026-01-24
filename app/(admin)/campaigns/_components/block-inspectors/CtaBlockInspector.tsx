"use client";

import { Block } from "../../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CtaBlockInspectorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

export default function CtaBlockInspector({
  block,
  onUpdate,
}: CtaBlockInspectorProps) {
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
        <Label className="text-xs font-medium text-gray-700">Buton Metni</Label>
        <Input
          value={block.content.buttonText || ""}
          onChange={(e) => updateContent("buttonText", e.target.value)}
          placeholder="Hemen Harca"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Link URL</Label>
        <Input
          value={block.content.linkUrl || ""}
          onChange={(e) => updateContent("linkUrl", e.target.value)}
          placeholder="https://..."
          className="mt-1"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-gray-700">UTM Parametreleri</Label>
        <Switch
          checked={block.content.useUtm || false}
          onCheckedChange={(checked) => updateContent("useUtm", checked)}
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Arka Plan Rengi</Label>
        <Input
          type="color"
          value={block.style.backgroundColor || "#000000"}
          onChange={(e) => updateStyle("backgroundColor", e.target.value)}
          className="mt-1 h-10"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Metin Rengi</Label>
        <Input
          type="color"
          value={block.style.textColor || "#ffffff"}
          onChange={(e) => updateStyle("textColor", e.target.value)}
          className="mt-1 h-10"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Border Radius</Label>
        <Input
          value={block.style.borderRadius || "4px"}
          onChange={(e) => updateStyle("borderRadius", e.target.value)}
          placeholder="4px"
          className="mt-1"
        />
      </div>
    </div>
  );
}
