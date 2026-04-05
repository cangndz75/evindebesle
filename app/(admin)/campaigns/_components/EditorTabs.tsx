"use client";

import { useState } from "react";
import { Blocks, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlockEditor from "./BlockEditor";
import HtmlEditor from "./HtmlEditor";
import { CampaignDraft, Block } from "../types";

interface EditorTabsProps {
  draft: CampaignDraft;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onAddBlock: (blockType: Block["type"]) => void;
  onUpdateBlock: (blockId: string, updates: Partial<Block>) => void;
  onRemoveBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: "up" | "down") => void;
  selectedBlock: Block | null;
}

export default function EditorTabs({
  draft,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlock,
  selectedBlock,
}: EditorTabsProps) {
  const [activeTab, setActiveTab] = useState<"blocks" | "html">("blocks");

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="flex items-center border-b border-gray-200 bg-gray-50 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("blocks")}
          className={`rounded-none border-b-2 ${
            activeTab === "blocks"
              ? "border-blue-500 text-blue-600"
              : "border-transparent"
          }`}
        >
          <Blocks className="w-4 h-4 mr-2" />
          Blok EditÃ¶r
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("html")}
          className={`rounded-none border-b-2 ${
            activeTab === "html"
              ? "border-blue-500 text-blue-600"
              : "border-transparent"
          }`}
        >
          <Code className="w-4 h-4 mr-2" />
          HTML Modu
        </Button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "blocks" ? (
          <BlockEditor
            draft={draft}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
            onAddBlock={onAddBlock}
            onUpdateBlock={onUpdateBlock}
            onRemoveBlock={onRemoveBlock}
            onMoveBlock={onMoveBlock}
            selectedBlock={selectedBlock}
          />
        ) : (
          <HtmlEditor
            draft={draft}
            onUpdate={(blocks) => {
            }}
          />
        )}
      </div>
    </div>
  );
}
