"use client";

import { useState } from "react";
import { Block } from "../../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageBlockInspectorProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
}

export default function ImageBlockInspector({
    block,
    onUpdate,
}: ImageBlockInspectorProps) {
    const [isUploading, setIsUploading] = useState(false);

    const updateContent = (key: string, value: unknown) => {
        onUpdate({
            content: { ...block.content, [key]: value },
        });
    };

    const updateStyle = (key: string, value: unknown) => {
        onUpdate({
            style: { ...block.style, [key]: value },
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Lütfen bir görsel dosyası seçin");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
            return;
        }

        setIsUploading(true);
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
            updateContent("imageUrl", data.url);
            toast.success("Görsel yüklendi");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Görsel yüklenirken hata oluştu");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            
            <div>
                <Label className="text-xs font-medium text-gray-700">Görsel URL</Label>
                <div className="flex gap-2 mt-1">
                    <Input
                        value={block.content.imageUrl || ""}
                        onChange={(e) => updateContent("imageUrl", e.target.value)}
                        placeholder="https://..."
                        className="flex-1"
                    />
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={isUploading}
                            asChild
                        >
                            <span>
                                <Upload className="w-4 h-4" />
                            </span>
                        </Button>
                    </label>
                </div>
                {isUploading && (
                    <p className="text-xs text-gray-500 mt-1">Yükleniyor...</p>
                )}
            </div>

            
            {block.content.imageUrl && (
                <div className="border rounded-lg p-2">
                    <img
                        src={block.content.imageUrl}
                        alt="Preview"
                        className="w-full h-auto max-h-32 object-contain"
                    />
                </div>
            )}

            
            <div>
                <Label className="text-xs font-medium text-gray-700">
                    Alt Metin (SEO)
                </Label>
                <Input
                    value={block.content.altText || ""}
                    onChange={(e) => updateContent("altText", e.target.value)}
                    placeholder="Görsel açıklaması..."
                    className="mt-1"
                />
            </div>

            
            <div>
                <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Link (opsiyonel)
                </Label>
                <Input
                    value={block.content.linkUrl || ""}
                    onChange={(e) => updateContent("linkUrl", e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                />
            </div>

            
            <div>
                <Label className="text-xs font-medium text-gray-700">Hizalama</Label>
                <Select
                    value={block.style.alignment || "center"}
                    onValueChange={(value) => updateStyle("alignment", value)}
                >
                    <SelectTrigger className="mt-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="left">Sol</SelectItem>
                        <SelectItem value="center">Orta</SelectItem>
                        <SelectItem value="right">Sağ</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            
            <div>
                <Label className="text-xs font-medium text-gray-700">
                    Maksimum Genişlik: {block.style.maxWidth || 100}%
                </Label>
                <Slider
                    value={[block.style.maxWidth || 100]}
                    onValueChange={([value]) => updateStyle("maxWidth", value)}
                    min={20}
                    max={100}
                    step={5}
                    className="mt-2"
                />
            </div>

            
            <div>
                <Label className="text-xs font-medium text-gray-700">
                    Dikey Boşluk: {block.style.paddingY || 16}px
                </Label>
                <Slider
                    value={[block.style.paddingY || 16]}
                    onValueChange={([value]) => updateStyle("paddingY", value)}
                    min={0}
                    max={64}
                    step={4}
                    className="mt-2"
                />
            </div>

            
            <div>
                <Label className="text-xs font-medium text-gray-700">
                    Arka Plan Rengi
                </Label>
                <Input
                    type="color"
                    value={block.style.backgroundColor || "#ffffff"}
                    onChange={(e) => updateStyle("backgroundColor", e.target.value)}
                    className="mt-1 h-10"
                />
            </div>
        </div>
    );
}
