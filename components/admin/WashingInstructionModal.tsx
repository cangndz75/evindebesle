"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface WashingInstructionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    editData?: {
        id: string;
        title: string;
        content: string;
    } | null;
}

export function WashingInstructionModal({
    open,
    onOpenChange,
    onSuccess,
    editData,
}: WashingInstructionModalProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(editData?.title || "");
    const [content, setContent] = useState(editData?.content || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editData
                ? `/api/admin/washing-instructions/${editData.id}`
                : "/api/admin/washing-instructions";

            const method = editData ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content }),
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success(editData ? "Güncellendi!" : "Oluşturuldu!");
            onSuccess();
            onOpenChange(false);
            setTitle("");
            setContent("");
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {editData ? "Yıkama Talimatı Düzenle" : "Yeni Yıkama Talimatı"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Başlık</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Örn: Pamuklu Kumaşlar İçin"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">İçerik</Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Yıkama talimatlarını buraya yazın..."
                            rows={10}
                            required
                        />
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
