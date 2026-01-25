"use client";

import { useState, useCallback } from "react";
import BlockInspector from "./BlockInspector";
import CampaignMetaBar from "./CampaignMetaBar";
import EditorTabs from "./EditorTabs";
import PreviewPane from "./PreviewPane";
import SendBar from "./SendBar";
import { CampaignDraft, Block } from "../types";

const initialDraft: CampaignDraft = {
  id: null,
  name: "",
  status: "draft",
  subject: "",
  preheader: "",
  fromName: "Evinde Besle",
  fromEmail: "info@evindebesle.com",
  replyTo: "info@evindebesle.com",
  blocks: [],
  audienceSegmentId: null,
  scheduleAt: null,
};

export default function CampaignComposerPage() {
  const [draft, setDraft] = useState<CampaignDraft>(initialDraft);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewUser, setPreviewUser] = useState<string>("default");
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [history, setHistory] = useState<CampaignDraft[]>([initialDraft]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const updateDraft = useCallback((updates: Partial<CampaignDraft>) => {
    setDraft((prev) => {
      const newDraft = { ...prev, ...updates };
      // History'ye ekle (undo/redo için)
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDraft);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newDraft;
    });
  }, [history, historyIndex]);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setDraft((prev) => {
      const newBlocks = prev.blocks.map((block) =>
        block.id === blockId ? { ...block, ...updates } : block
      );
      const newDraft = { ...prev, blocks: newBlocks };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDraft);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newDraft;
    });
  }, [history, historyIndex]);

  const addBlock = useCallback((blockType: Block["type"]) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: blockType,
      content: {},
      style: {},
      visibility: { mobile: true, desktop: true },
    };
    setDraft((prev) => {
      const newBlocks = [...prev.blocks, newBlock];
      const newDraft = { ...prev, blocks: newBlocks };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDraft);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newDraft;
    });
    setSelectedBlockId(newBlock.id);
  }, [history, historyIndex]);

  const removeBlock = useCallback((blockId: string) => {
    setDraft((prev) => {
      const newBlocks = prev.blocks.filter((block) => block.id !== blockId);
      const newDraft = { ...prev, blocks: newBlocks };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDraft);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newDraft;
    });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [history, historyIndex, selectedBlockId]);

  const moveBlock = useCallback((blockId: string, direction: "up" | "down") => {
    setDraft((prev) => {
      const index = prev.blocks.findIndex((b) => b.id === blockId);
      if (index === -1) return prev;

      const newBlocks = [...prev.blocks];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newBlocks.length) return prev;

      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];

      const newDraft = { ...prev, blocks: newBlocks };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDraft);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newDraft;
    });
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setDraft(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setDraft(history[newIndex]);
    }
  }, [history, historyIndex]);

  const selectedBlock = draft.blocks.find((b) => b.id === selectedBlockId) || null;

  return (
    <div className="flex flex-col bg-gray-50 h-full w-full">
      {/* A) ÜST BAR: Kampanya Meta */}
      <div className="flex-shrink-0">
        <CampaignMetaBar
          draft={draft}
          onUpdate={updateDraft}
          onUndo={undo}
          onRedo={redo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />
      </div>

      {/* B) ORTA ALAN: Editör + Preview */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Sol: Editör */}
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-white" style={{ minWidth: 0 }}>
          <EditorTabs
            draft={draft}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onAddBlock={addBlock}
            onUpdateBlock={updateBlock}
            onRemoveBlock={removeBlock}
            onMoveBlock={moveBlock}
            selectedBlock={selectedBlock}
          />
        </div>

        {/* Sağ: Sidebar (Preview veya Inspector) */}
        <div className="w-[360px] border-l border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0 transition-all duration-300">
          {selectedBlock ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                <h3 className="font-semibold text-sm">Blok Ayarları</h3>
                <button
                  onClick={() => setSelectedBlockId(null)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Kapat
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <BlockInspector
                  block={selectedBlock}
                  onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                />
              </div>
            </div>
          ) : (
            <PreviewPane
              draft={draft}
              previewUser={previewUser}
              deviceView={deviceView}
              onPreviewUserChange={setPreviewUser}
              onDeviceViewChange={setDeviceView}
            />
          )}
        </div>
      </div>

      {/* C) ALT BAR: Gönderim ve Test */}
      <div className="flex-shrink-0">
        <SendBar
          draft={draft}
          onUpdate={updateDraft}
        />
      </div>
    </div>
  );
}
