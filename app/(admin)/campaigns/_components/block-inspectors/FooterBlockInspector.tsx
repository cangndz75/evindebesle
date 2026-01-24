"use client";

import { Block } from "../../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FooterBlockInspectorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

export default function FooterBlockInspector({
  block,
  onUpdate,
}: FooterBlockInspectorProps) {
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
        <Label className="text-xs font-medium text-gray-700">Site Linki</Label>
        <Input
          value={block.content.siteLink || ""}
          onChange={(e) => updateContent("siteLink", e.target.value)}
          placeholder="https://..."
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Destek E-postası</Label>
        <Input
          type="email"
          value={block.content.supportEmail || ""}
          onChange={(e) => updateContent("supportEmail", e.target.value)}
          placeholder="destek@example.com"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Adres</Label>
        <Textarea
          value={block.content.address || ""}
          onChange={(e) => updateContent("address", e.target.value)}
          placeholder="Şirket adresi..."
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
