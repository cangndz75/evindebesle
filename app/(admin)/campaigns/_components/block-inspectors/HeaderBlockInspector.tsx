"use client";

import { Block } from "../../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface HeaderBlockInspectorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

export default function HeaderBlockInspector({
  block,
  onUpdate,
}: HeaderBlockInspectorProps) {
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

  const menuLinks = block.content.menuLinks || [];

  const addMenuLink = () => {
    const newLinks = [...menuLinks, { text: "", url: "" }];
    updateContent("menuLinks", newLinks);
  };

  const updateMenuLink = (index: number, field: string, value: string) => {
    const newLinks = [...menuLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    updateContent("menuLinks", newLinks);
  };

  const removeMenuLink = (index: number) => {
    const newLinks = menuLinks.filter((_: any, i: number) => i !== index);
    updateContent("menuLinks", newLinks);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium text-gray-700">Logo URL</Label>
        <Input
          value={block.content.logoUrl || ""}
          onChange={(e) => updateContent("logoUrl", e.target.value)}
          placeholder="https://..."
          className="mt-1"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-medium text-gray-700">Menü Linkleri</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addMenuLink}
            className="h-6"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <div className="space-y-2">
          {menuLinks.map((link: any, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={link.text || ""}
                onChange={(e) =>
                  updateMenuLink(index, "text", e.target.value)
                }
                placeholder="Link metni"
                className="flex-1"
              />
              <Input
                value={link.url || ""}
                onChange={(e) => updateMenuLink(index, "url", e.target.value)}
                placeholder="URL"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeMenuLink(index)}
                className="h-9 w-9 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
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
