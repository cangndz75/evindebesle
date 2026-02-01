"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ModelInfoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    editData?: {
        id: string;
        title: string;
        height: string;
        size: string;
        gender?: string | null;
    } | null;
}

export function ModelInfoModal({
    open,
    onOpenChange,
    onSuccess,
    editData,
}: ModelInfoModalProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(editData?.title || "");
    const [height, setHeight] = useState(editData?.height || "");
    const [size, setSize] = useState(editData?.size || "");
    const [gender, setGender] = useState<string>(editData?.gender || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editData
                ? `/api/admin/model-info/${editData.id}`
                : "/api/admin/model-info";

            const method = editData ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    height,
                    size,
                    gender: gender || null,
                }),
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success(editData ? "Güncellendi!" : "Oluşturuldu!");
            onSuccess();
            onOpenChange(false);
            setTitle("");
            setHeight("");
            setSize("");
            setGender("");
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
                        {editData ? "Model Bilgisi Düzenle" : "Yeni Model Bilgisi"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Başlık</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Örn: Erkek Model - Tall"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="height">Boy</Label>
                            <Input
                                id="height"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                placeholder="Örn: 185 cm"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="size">Beden</Label>
                            <Input
                                id="size"
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                placeholder="Örn: M veya 50"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gender">Cinsiyet</Label>
                        <Select value={gender} onValueChange={setGender}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seçiniz..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Belirtilmemiş</SelectItem>
                                <SelectItem value="MALE">Erkek</SelectItem>
                                <SelectItem value="FEMALE">Kadın</SelectItem>
                                <SelectItem value="UNISEX">Unisex</SelectItem>
                            </SelectContent>
                        </Select>
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
