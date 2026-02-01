"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TemplateSelectorProps {
    washingInstructionId: string;
    deliveryInfoId: string;
    sizeNoteId: string;
    sizeGuideId: string;
    modelInfoId: string;
    washingInstructions: any[];
    deliveryInfos: any[];
    sizeNotes: any[];
    sizeGuides: any[];
    modelInfos: any[];
    onWashingChange: (value: string) => void;
    onDeliveryChange: (value: string) => void;
    onSizeNoteChange: (value: string) => void;
    onSizeGuideChange: (value: string) => void;
    onModelInfoChange: (value: string) => void;
}

export function TemplateSelector({
    washingInstructionId,
    deliveryInfoId,
    sizeNoteId,
    sizeGuideId,
    modelInfoId,
    washingInstructions,
    deliveryInfos,
    sizeNotes,
    sizeGuides,
    modelInfos,
    onWashingChange,
    onDeliveryChange,
    onSizeNoteChange,
    onSizeGuideChange,
    onModelInfoChange,
}: TemplateSelectorProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Ürün Detay Şablonları</h2>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="washingInstruction">Yıkama Talimatı</Label>
                    <Select value={washingInstructionId} onValueChange={onWashingChange}>
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seçiniz..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Seçim Yok</SelectItem>
                            {washingInstructions.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="deliveryInfo">Teslimat ve İade Bilgisi</Label>
                    <Select value={deliveryInfoId} onValueChange={onDeliveryChange}>
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seçiniz..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Seçim Yok</SelectItem>
                            {deliveryInfos.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="sizeNote">Beden Notu</Label>
                    <Select value={sizeNoteId} onValueChange={onSizeNoteChange}>
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seçiniz..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Seçim Yok</SelectItem>
                            {sizeNotes.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="sizeGuide">Beden Rehberi</Label>
                    <Select value={sizeGuideId} onValueChange={onSizeGuideChange}>
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seçiniz..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Seçim Yok</SelectItem>
                            {sizeGuides.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="modelInfo">Model Bilgisi</Label>
                    <Select value={modelInfoId} onValueChange={onModelInfoChange}>
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seçiniz..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Seçim Yok</SelectItem>
                            {modelInfos.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
