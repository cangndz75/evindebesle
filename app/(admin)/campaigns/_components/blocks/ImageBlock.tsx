"use client";

import { Block } from "../../types";
import { toast } from "sonner";

interface ImageBlockProps {
    block: Block;
    onUpdate?: (updates: Partial<Block>) => void;
}

export default function ImageBlock({ block, onUpdate }: ImageBlockProps) {
    const imageUrl = block.content.imageUrl || "";
    const altText = block.content.altText || "";
    const linkUrl = block.content.linkUrl || "";
    const alignment = block.style.alignment || "center";
    const backgroundColor = block.style.backgroundColor || "#ffffff";
    const paddingY = block.style.paddingY || 16;
    const maxWidth = block.style.maxWidth || 100; // percentage

    const alignmentClasses: Record<string, string> = {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end",
    };
    const alignmentClass = alignmentClasses[alignment] || "justify-center";

    if (!imageUrl) {
        return (
            <div className="p-8 text-center" style={{ backgroundColor }}>
                <div className="border-2 border-dashed border-gray-300 rounded-lg py-12 px-4 flex flex-col items-center gap-4">
                    <p className="text-gray-400 text-sm">
                        Görsel eklemek için sağ panelden URL girin veya buraya tıklayıp yükleyin
                    </p>
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                if (!file.type.startsWith("image/")) {
                                    toast.error("Lütfen bir görsel dosyası seçin");
                                    return;
                                }

                                if (!onUpdate) {
                                    console.warn("Update capability not available");
                                    return;
                                }

                                try {
                                    const formData = new FormData();
                                    formData.append("file", file);

                                    const response = await fetch("/api/upload", {
                                        method: "POST",
                                        body: formData,
                                    });

                                    if (!response.ok) {
                                        throw new Error("Upload failed");
                                    }

                                    const data = await response.json();

                                    onUpdate({
                                        content: { ...block.content, imageUrl: data.url }
                                    });
                                } catch (error) {
                                    console.error("Upload error:", error);
                                    toast.error("Yükleme sırasında bir hata oluştu");
                                }
                            }}
                        />
                        <div className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors text-sm cursor-pointer">
                            Görsel Yükle
                        </div>
                    </label>
                </div>
            </div>
        );
    }

    const imageElement = (
        <img
            src={imageUrl}
            alt={altText}
            className="max-w-full h-auto"
            style={{ maxWidth: `${maxWidth}%` }}
        />
    );

    return (
        <div
            className={`flex ${alignmentClass}`}
            style={{
                backgroundColor,
                paddingTop: paddingY,
                paddingBottom: paddingY,
                paddingLeft: 16,
                paddingRight: 16,
            }}
        >
            {linkUrl ? (
                <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                    {imageElement}
                </a>
            ) : (
                imageElement
            )}
        </div>
    );
}
