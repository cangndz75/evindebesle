"use client";

import { Block } from "../../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface DividerBlockInspectorProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
}

export default function DividerBlockInspector({
    block,
    onUpdate,
}: DividerBlockInspectorProps) {
    const updateStyle = (key: string, value: unknown) => {
        onUpdate({
            style: { ...block.style, [key]: value },
        });
    };

    return (
        <div className="space-y-4">
            
            <div>
                <Label className="text-xs font-medium text-gray-700">Çizgi Rengi</Label>
                <Input
                    type="color"
                    value={block.style.lineColor || "#e5e7eb"}
                    onChange={(e) => updateStyle("lineColor", e.target.value)}
                    className="mt-1 h-10"
                />
            </div>

            
            <div>
                <Label className="text-xs font-medium text-gray-700">
                    Çizgi Kalınlığı: {block.style.lineWidth || 1}px
                </Label>
                <Slider
                    value={[block.style.lineWidth || 1]}
                    onValueChange={([value]) => updateStyle("lineWidth", value)}
                    min={1}
                    max={8}
                    step={1}
                    className="mt-2"
                />
            </div>

            
            <div>
                <Label className="text-xs font-medium text-gray-700">Çizgi Stili</Label>
                <Select
                    value={block.style.lineStyle || "solid"}
                    onValueChange={(value) => updateStyle("lineStyle", value)}
                >
                    <SelectTrigger className="mt-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="solid">Düz</SelectItem>
                        <SelectItem value="dashed">Kesikli</SelectItem>
                        <SelectItem value="dotted">Noktalı</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            
            <div>
                <Label className="text-xs font-medium text-gray-700">
                    Genişlik: {block.style.widthPercent || 100}%
                </Label>
                <Slider
                    value={[block.style.widthPercent || 100]}
                    onValueChange={([value]) => updateStyle("widthPercent", value)}
                    min={20}
                    max={100}
                    step={5}
                    className="mt-2"
                />
            </div>

            
            <div>
                <Label className="text-xs font-medium text-gray-700">
                    Dikey Boşluk: {block.style.paddingY || 24}px
                </Label>
                <Slider
                    value={[block.style.paddingY || 24]}
                    onValueChange={([value]) => updateStyle("paddingY", value)}
                    min={8}
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
