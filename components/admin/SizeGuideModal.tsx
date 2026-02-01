"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface SizeGuideModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    editData?: {
        id: string;
        title: string;
        imageUrl?: string | null;
        content?: any;
    } | null;
}

export function SizeGuideModal({
    open,
    onOpenChange,
    onSuccess,
    editData,
}: SizeGuideModalProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(editData?.title || "");
    const [imageUrl, setImageUrl] = useState(editData?.imageUrl || "");
    const [content, setContent] = useState(
        editData?.content ? JSON.stringify(editData.content, null, 2) : ""
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let parsedContent = null;
            if (content.trim()) {
                try {
                    parsedContent = JSON.parse(content);
                } catch {
                    toast.error("JSON formatı hatalı");
                    setLoading(false);
                    return;
                }
            }

            const url = editData
                ? `/api/admin/size-guides/${editData.id}`
                : "/api/admin/size-guides";

            const method = editData ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    imageUrl: imageUrl || null,
                    content: parsedContent,
                }),
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success(editData ? "Güncellendi!" : "Oluşturuldu!");
            onSuccess();
            onOpenChange(false);
            setTitle("");
            setImageUrl("");
            setContent("");
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editData ? "Beden Rehberi Düzenle" : "Yeni Beden Rehberi"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Başlık</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Örn: Kadın Üst Giyim"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">Görsel URL (Opsiyonel)</Label>
                        <Input
                            id="imageUrl"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/size-guide.png"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Tablo Verisi (JSON - Opsiyonel)</Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder='{"headers": ["Beden", "Göğüs", "Bel"], "rows": [["S", "84-88", "64-68"]]}'
                            rows={10}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500">
                            JSON formatında tablo verisi girebilirsiniz
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            İptal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
