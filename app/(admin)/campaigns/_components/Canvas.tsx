"use client";

import { Block } from "../types";
import BlockRenderer from "./BlockRenderer";

interface CanvasProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
}

export default function Canvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
}: CanvasProps) {
  return (
    <div className="p-6 bg-gray-100" style={{ minHeight: '100%' }}>
      <div className="max-w-6xl mx-auto bg-white shadow-lg">
        {/* Email Container */}
        <div className="border border-gray-300">
          {blocks.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-sm">Blok eklemek için sol panelden seçin</p>
            </div>
          ) : (
            blocks.map((block) => (
              <div
                key={block.id}
                onClick={() => onSelectBlock(block.id)}
                className={`cursor-pointer transition-all ${
                  selectedBlockId === block.id
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : "hover:bg-gray-50"
                }`}
              >
                <BlockRenderer block={block} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
