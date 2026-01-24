"use client";

import { useState } from "react";
import { Plus, GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlocksPalette from "./BlocksPalette";
import BlockInspector from "./BlockInspector";
import Canvas from "./Canvas";
import { CampaignDraft, Block } from "../types";

interface BlockEditorProps {
  draft: CampaignDraft;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onAddBlock: (blockType: Block["type"]) => void;
  onUpdateBlock: (blockId: string, updates: Partial<Block>) => void;
  onRemoveBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: "up" | "down") => void;
  selectedBlock: Block | null;
}

export default function BlockEditor({
  draft,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlock,
  selectedBlock,
}: BlockEditorProps) {
  const [showPalette, setShowPalette] = useState(false);

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>
      {/* Sol: Blok Listesi ve Palette */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={() => setShowPalette(!showPalette)}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Blok Ekle
          </Button>
        </div>

        {showPalette && (
          <div className="border-b border-gray-200 p-4">
            <BlocksPalette onSelectBlock={onAddBlock} />
          </div>
        )}

        {/* Blok Listesi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {draft.blocks.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">
              Henüz blok eklenmedi
            </div>
          ) : (
            draft.blocks.map((block, index) => (
              <div
                key={block.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedBlockId === block.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => onSelectBlock(block.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-700">
                      {block.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveBlock(block.id, "up");
                      }}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveBlock(block.id, "down");
                      }}
                      disabled={index === draft.blocks.length - 1}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBlock(block.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {block.type === "header" && "Header"}
                  {block.type === "hero" && "Hero Banner"}
                  {block.type === "coupon" && "Kupon Bloğu"}
                  {block.type === "cta" && "CTA Button"}
                  {block.type === "footer" && "Footer"}
                  {block.type === "text" && "Metin"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Orta: Canvas */}
      <div className="flex-1 overflow-y-auto bg-white">
        <Canvas
          blocks={draft.blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={onSelectBlock}
        />
      </div>

      {/* Sağ: Block Inspector */}
      {selectedBlock && (
        <div className="w-72 border-l border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
          <BlockInspector
            block={selectedBlock}
            onUpdate={(updates) => onUpdateBlock(selectedBlock.id, updates)}
          />
        </div>
      )}
    </div>
  );
}
