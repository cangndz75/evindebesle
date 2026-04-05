import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import React from "react";

import { SIZE_OPTIONS, SizeType } from "./ProductSizeStock";

export type { SizeType };

export interface VariantImage {
    url: string;
    file?: File;
}

export interface Color {
    id: string;
    name: string;
    hexCode: string;
    images: string[];
    sizes: string[];
    price?: string;
    originalPrice?: string;
    useMainPrice?: boolean;
    stock?: { [sizeName: string]: number };
    isOpen?: boolean;
}

interface ProductVariantsProps {
    isVariable: boolean;
    setIsVariable: (value: boolean) => void;
    sizeType: SizeType;
    setSizeType: (value: SizeType) => void;
    availableSizes: string[];
    colors: Color[];
    setColors: (colors: Color[]) => void;
    onColorImageUpload: (files: FileList, colorIndex: number) => void;
    mainPrice?: string;
    mainOriginalPrice?: string;
}

export function ProductVariants({
    isVariable, setIsVariable,
    sizeType, setSizeType,
    colors, setColors,
    onColorImageUpload,
    mainPrice,
    mainOriginalPrice
}: ProductVariantsProps) {
    const [newColorName, setNewColorName] = useState("");

    const sizes = SIZE_OPTIONS[sizeType];

    const addColor = () => {
        if (!newColorName.trim()) return;

        const newColor: Color = {
            id: Math.random().toString(36).substr(2, 9),
            name: newColorName,
            hexCode: "",
            images: [],
            sizes: sizes,
            stock: {},
            isOpen: true,
            useMainPrice: true,
            price: "",
            originalPrice: ""
        };

        setColors([...colors, newColor]);
        setNewColorName("");
    };

    const removeColor = (index: number) => {
        const newColors = [...colors];
        newColors.splice(index, 1);
        setColors(newColors);
    };

    const updateColor = (index: number, updates: Partial<Color>) => {
        const newColors = [...colors];
        newColors[index] = { ...newColors[index], ...updates };
        setColors(newColors);
    };

    const updateStock = (colorIndex: number, size: string, quantity: number) => {
        const newColors = [...colors];
        const color = newColors[colorIndex];
        const newStock = { ...(color.stock || {}) };
        newStock[size] = quantity;
        color.stock = newStock;
        setColors(newColors);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">DiÄŸer Varyant SeÃ§enekleri</h2>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="isVariable"
                        checked={isVariable}
                        onCheckedChange={(c) => setIsVariable(c as boolean)}
                    />
                    <Label htmlFor="isVariable" className="text-sm font-medium cursor-pointer">
                        Bu Ã¼rÃ¼nÃ¼n varyantlarÄ± var (renk, beden)
                    </Label>
                </div>
            </div>

            {isVariable && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    {/* 2. Add Colors */}
                    <div>
                        <Label className="mb-2 block font-semibold text-gray-700">DiÄŸer Renkleri Ekle</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Renk adÄ± (Ã¶rn. Lacivert)"
                                value={newColorName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewColorName(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addColor()}
                            />
                            <Button onClick={addColor} className="bg-gray-900 text-white shrink-0">
                                <Plus className="w-4 h-4 mr-2" /> Renk Ekle
                            </Button>
                        </div>
                    </div>

                    {/* 3. Color Accordions */}
                    <div className="space-y-4">
                        {colors.map((color, colorIndex) => (
                            <VariantItem
                                key={color.id}
                                color={color}
                                index={colorIndex}
                                sizes={sizes}
                                updateColor={updateColor}
                                updateStock={updateStock}
                                removeColor={removeColor}
                                onColorImageUpload={onColorImageUpload}
                                mainPrice={mainPrice}
                                mainOriginalPrice={mainOriginalPrice}
                            />
                        ))}

                        {colors.length === 0 && (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded border border-dashed">
                                BaÅŸlamak iÃ§in yukarÄ±dan bir renk ekleyin.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface VariantItemProps {
    color: Color;
    index: number;
    sizes: string[];
    updateColor: (index: number, updates: Partial<Color>) => void;
    updateStock: (index: number, size: string, quantity: number) => void;
    removeColor: (index: number) => void;
    onColorImageUpload: (files: FileList, colorIndex: number) => void;
    mainPrice?: string;
    mainOriginalPrice?: string;
}

const VariantItem = React.memo(({
    color,
    index,
    sizes,
    updateColor,
    updateStock,
    removeColor,
    onColorImageUpload,
    mainPrice,
    mainOriginalPrice
}: VariantItemProps) => {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer select-none"
                onClick={() => updateColor(index, { isOpen: !color.isOpen })}
            >
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: color.hexCode || "#000000" }} />
                    <span className="font-semibold text-gray-900">{color.name}</span>
                    <span className="text-xs text-gray-500">
                        ({(color.sizes || sizes).length} beden, {(color.images || []).length} gÃ¶rsel)
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); removeColor(index); }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    {color.isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
            </div>

            {/* Body */}
            {color.isOpen && (
                <div className="p-4 border-t border-gray-100 space-y-6">
                    {/* Color Config */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-xs mb-1.5 block">GÃ¶rÃ¼nen Ä°sim</Label>
                            <Input
                                value={color.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateColor(index, { name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label className="text-xs mb-1.5 block">Renk Kodu (Hex)</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    className="w-12 h-10 p-1 cursor-pointer"
                                    value={(/^#[0-9A-Fa-f]{6}$/.test(color.hexCode || "")) ? color.hexCode : "#000000"}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateColor(index, { hexCode: e.target.value })}
                                />
                                <Input
                                    value={color.hexCode}
                                    placeholder="#000000"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const val = e.target.value;
                                        if (val.length > 7) return;
                                        updateColor(index, { hexCode: val });
                                    }}
                                    className="uppercase"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Price Override */}
                    <div className="bg-gray-50 border border-gray-100 rounded p-3">
                        <div className="flex items-center space-x-2 mb-3">
                            <Checkbox
                                id={`use-main-${color.id}`}
                                checked={color.useMainPrice !== false}
                                onCheckedChange={(c) => updateColor(index, { useMainPrice: c as boolean })}
                            />
                            <Label htmlFor={`use-main-${color.id}`} className="text-sm font-medium cursor-pointer">
                                Ana Ã¼rÃ¼n fiyatlarÄ±nÄ± kullan ({mainPrice} TL / {mainOriginalPrice || "-"} TL)
                            </Label>
                        </div>

                        {color.useMainPrice === false && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                <div>
                                    <Label className="text-xs mb-1 block">Fiyat *</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={color.price || ""}
                                        onChange={(e) => updateColor(index, { price: e.target.value })}
                                        className="bg-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs mb-1 block">Ä°ndirimsiz (Liste) Fiyat</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={color.originalPrice || ""}
                                        onChange={(e) => updateColor(index, { originalPrice: e.target.value })}
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Images */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Varyant GÃ¶rselleri</Label>
                            <div className="relative">
                                <LinkButtonOnClick />
                                {/* Hacky way to handle upload button click without ref mess in map */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="relative"
                                >
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files && onColorImageUpload(e.target.files, index)}
                                    />
                                    <UploadIcon /> YÃ¼kle
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-2 overflow-x-auto py-2 bg-gray-50 rounded p-2">
                            {(!color.images || color.images.length === 0) ? (
                                <span className="text-xs text-gray-400 italic p-2">Bu renk iÃ§in henÃ¼z gÃ¶rsel seÃ§ilmedi.</span>
                            ) : (
                                color.images.map((img, i) => (
                                    <div key={i} className="relative w-16 h-16 shrink-0 border rounded overflow-hidden group">
                                        <Image src={img} alt="" fill className="object-cover" />
                                        <div
                                            className="absolute top-0 right-0 p-0.5 bg-black/50 hover:bg-red-500 cursor-pointer text-white"
                                            onClick={() => {
                                                const newImgs = [...color.images];
                                                newImgs.splice(i, 1);
                                                updateColor(index, { images: newImgs });
                                            }}
                                        >
                                            <X className="w-3 h-3" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Stock Matrix */}
                    <div>
                        <Label className="text-sm font-medium mb-3 block">Stok Seviyeleri ve Bedenler</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {sizes.map(size => (
                                <div key={size} className="bg-gray-50 p-2 rounded border border-gray-100 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-700">{size}</span>
                                        <Checkbox
                                            checked={color.sizes?.includes(size) ?? true}
                                            onCheckedChange={(checked) => {
                                                let currentSizes = color.sizes || [...sizes];
                                                if (checked) {
                                                    if (!currentSizes.includes(size)) currentSizes.push(size);
                                                } else {
                                                    currentSizes = currentSizes.filter(s => s !== size);
                                                }
                                                updateColor(index, { sizes: currentSizes });
                                            }}
                                            className="w-3 h-3"
                                        />
                                    </div>
                                    {(color.sizes?.includes(size) ?? true) && (
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="h-7 text-xs px-2 bg-white"
                                            value={color.stock?.[size] ?? 0}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStock(index, size, parseInt(e.target.value) || 0)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

function LinkButtonOnClick() { return null; }
function UploadIcon() { return <Plus className="w-3 h-3 mr-1" />; }
