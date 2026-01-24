"use client";

import { Block } from "../../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface HeroBlockInspectorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

export default function HeroBlockInspector({
  block,
  onUpdate,
}: HeroBlockInspectorProps) {
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
        <Label className="text-xs font-medium text-gray-700">Banner Görseli URL</Label>
        <Input
          value={block.content.imageUrl || ""}
          onChange={(e) => updateContent("imageUrl", e.target.value)}
          placeholder="https://..."
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Üst Mesaj</Label>
        <Input
          value={block.content.message || ""}
          onChange={(e) => updateContent("message", e.target.value)}
          placeholder="Uzun zamandır görüşemedik..."
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Karşılama Metni</Label>
        <Input
          value={block.content.greeting || ""}
          onChange={(e) => updateContent("greeting", e.target.value)}
          placeholder="Merhaba {{first_name|fallback:''}}"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Açıklama</Label>
        <Textarea
          value={block.content.description || ""}
          onChange={(e) => updateContent("description", e.target.value)}
          placeholder="Anılarını harika fotoğraflara dönüştürmen için..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Arka Plan Rengi</Label>
        <Input
          type="color"
          value={block.style.backgroundColor || "#f9fafb"}
          onChange={(e) => updateStyle("backgroundColor", e.target.value)}
          className="mt-1 h-10"
        />
      </div>
    </div>
  );
}
