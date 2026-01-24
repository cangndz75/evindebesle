"use client";

import { CampaignDraft } from "../types";
import BlockRenderer from "./BlockRenderer";

interface RenderedEmailProps {
  draft: CampaignDraft;
  previewUser: { id: string; name: string; variables: Record<string, string> };
  deviceView: "desktop" | "mobile";
}

// Basit değişken replace fonksiyonu
function replaceVariables(text: string, variables: Record<string, string>): string {
  if (!text) return text;
  
  // {{variable|fallback:""}} formatını işle
  return text.replace(/\{\{(\w+)(?:\|fallback:([^}]+))?\}\}/g, (match, varName, fallback) => {
    const value = variables[varName] || fallback || "";
    return value;
  });
}

export default function RenderedEmail({
  draft,
  previewUser,
  deviceView,
}: RenderedEmailProps) {
  // Blokları render et ve değişkenleri replace et
  const processedBlocks = draft.blocks.map((block) => {
    const processedContent = { ...block.content };
    
    // Tüm string değerlerde değişkenleri replace et
    Object.keys(processedContent).forEach((key) => {
      if (typeof processedContent[key] === "string") {
        processedContent[key] = replaceVariables(
          processedContent[key],
          previewUser.variables
        );
      }
    });

    return {
      ...block,
      content: processedContent,
    };
  });

  const maxWidth = deviceView === "mobile" ? "100%" : "600px";
  const backgroundColor = "#f9fafb";

  return (
    <div
      style={{
        maxWidth,
        margin: "0 auto",
        backgroundColor,
      }}
      className="shadow-lg"
    >
      <div className="bg-white">
        {processedBlocks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-sm">Henüz blok eklenmedi</p>
          </div>
        ) : (
          processedBlocks.map((block) => (
            <div key={block.id}>
              <BlockRenderer block={block} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
