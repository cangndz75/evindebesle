"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { CampaignDraft } from "../types";

interface HtmlEditorProps {
  draft: CampaignDraft;
  onUpdate: (blocks: any[]) => void;
}

export default function HtmlEditor({ draft, onUpdate }: HtmlEditorProps) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    const generatedHtml = draft.blocks
      .map((block) => {
        return `<div data-block-id="${block.id}" data-block-type="${block.type}">
          <!-- ${block.type} block -->
        </div>`;
      })
      .join("\n");
    setHtml(generatedHtml);
  }, [draft.blocks]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700">HTML EditÃ¶r</h3>
        <p className="text-xs text-gray-500 mt-1">
          GeliÅŸmiÅŸ kullanÄ±cÄ±lar iÃ§in HTML dÃ¼zenleme
        </p>
      </div>
      <div className="flex-1 p-4">
        <Textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          className="h-full font-mono text-sm"
          placeholder="HTML kodunu buraya yazÄ±n..."
        />
      </div>
    </div>
  );
}
