import { useState } from "react";
import { Block } from "../../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface HeroBlockInspectorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

export default function HeroBlockInspector({
  block,
  onUpdate,
}: HeroBlockInspectorProps) {
  const [isUploading, setIsUploading] = useState(false);

  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: { ...block.content, [key]: value },
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

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      updateContent("imageUrl", data.url);
      toast.success("Banner görseli yüklendi");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Görsel yüklenirken hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  const updateStyle = (key: string, value: any) => {
    onUpdate({
      style: { ...block.style, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium text-gray-700">Banner Görseli URL</Label>
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

      <div>
        <Label className="text-xs font-medium text-gray-700">Üst Mesaj</Label>
        <Input
          value={block.content.message || ""}
          onChange={(e) => updateContent("message", e.target.value)}
          placeholder="Uzun zamandır görüşemedik..."
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Karşılama Metni</Label>
        <Input
          value={block.content.greeting || ""}
          onChange={(e) => updateContent("greeting", e.target.value)}
          placeholder="Merhaba {{first_name|fallback:''}}"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-xs font-medium text-gray-700">Açıklama</Label>
        <Textarea
          value={block.content.description || ""}
          onChange={(e) => updateContent("description", e.target.value)}
          placeholder="Anılarını harika fotoğraflara dönüştürmen için..."
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
