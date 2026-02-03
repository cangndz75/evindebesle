import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import React from "react";

// Re-using types
export type SizeType = "letter" | "number" | "cup";

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
}

const SIZE_OPTIONS: Record<SizeType, string[]> = {
    letter: ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    number: ["32", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54"],
    cup: ["75A", "75B", "75C", "80A", "80B", "80C", "85B", "85C", "90B", "90C"]
};

export function ProductVariants({
    isVariable, setIsVariable,
    sizeType, setSizeType,
    colors, setColors,
    onColorImageUpload
}: ProductVariantsProps) {
    const [newColorName, setNewColorName] = useState("");

    const sizes = SIZE_OPTIONS[sizeType];

    const addColor = () => {
        if (!newColorName.trim()) return;

        const newColor: Color = {
            id: Math.random().toString(36).substr(2, 9),
            name: newColorName,
            hexCode: "#000000",
            images: [],
            sizes: sizes,
            stock: {},
            isOpen: true
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
                <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="isVariable"
                        checked={isVariable}
                        onCheckedChange={(c) => setIsVariable(c as boolean)}
                    />
                    <Label htmlFor="isVariable" className="text-sm font-medium cursor-pointer">
                        This product has variants (colors, sizes)
                    </Label>
                </div>
            </div>

            {isVariable && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">

                    {/* 1. Size Type Selection */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <Label className="mb-2 block font-semibold text-gray-700">Size System</Label>
                        <div className="flex flex-wrap gap-4">
                            {(Object.keys(SIZE_OPTIONS) as SizeType[]).map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id={`size-${type}`}
                                        name="sizeType"
                                        value={type}
                                        checked={sizeType === type}
                                        onChange={() => setSizeType(type)}
                                        className="text-black focus:ring-black border-gray-300"
                                    />
                                    <Label htmlFor={`size-${type}`} className="capitalize cursor-pointer">
                                        {type} Sizes
                                    </Label>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                            {sizes.map(s => (
                                <span key={s} className="text-xs px-2 py-1 bg-white border rounded text-gray-500">{s}</span>
                            ))}
                        </div>
                    </div>

                    {/* 2. Add Colors */}
                    <div>
                        <Label className="mb-2 block font-semibold text-gray-700">Add Colors</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Color name (e.g. Navy Blue)"
                                value={newColorName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewColorName(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addColor()}
                            />
                            <Button onClick={addColor} className="bg-gray-900 text-white shrink-0">
                                <Plus className="w-4 h-4 mr-2" /> Add Color
                            </Button>
                        </div>
                    </div>

                    {/* 3. Color Accordions */}
                    <div className="space-y-4">
                        {colors.map((color, colorIndex) => (
                            <div key={color.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                {/* Header */}
                                <div
                                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer select-none"
                                    onClick={() => updateColor(colorIndex, { isOpen: !color.isOpen })}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: color.hexCode }} />
                                        <span className="font-semibold text-gray-900">{color.name}</span>
                                        <span className="text-xs text-gray-500">
                                            ({(color.sizes || sizes).length} sizes, {(color.images || []).length} images)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={(e) => { e.stopPropagation(); removeColor(colorIndex); }}
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
                                                <Label className="text-xs mb-1.5 block">Display Name</Label>
                                                <Input
                                                    value={color.name}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateColor(colorIndex, { name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs mb-1.5 block">Color Hex</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="color"
                                                        className="w-12 h-10 p-1 cursor-pointer"
                                                        value={color.hexCode}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateColor(colorIndex, { hexCode: e.target.value })}
                                                    />
                                                    <Input
                                                        value={color.hexCode}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateColor(colorIndex, { hexCode: e.target.value })}
                                                        className="uppercase"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Images */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="text-sm font-medium">Variant Images</Label>
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
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files && onColorImageUpload(e.target.files, colorIndex)}
                                                        />
                                                        <UploadIcon /> Upload
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 overflow-x-auto py-2 bg-gray-50 rounded p-2">
                                                {(!color.images || color.images.length === 0) ? (
                                                    <span className="text-xs text-gray-400 italic p-2">No specific images for this color.</span>
                                                ) : (
                                                    color.images.map((img, i) => (
                                                        <div key={i} className="relative w-16 h-16 shrink-0 border rounded overflow-hidden group">
                                                            <Image src={img} alt="" fill className="object-cover" />
                                                            <div
                                                                className="absolute top-0 right-0 p-0.5 bg-black/50 hover:bg-red-500 cursor-pointer text-white"
                                                                onClick={() => {
                                                                    const newImgs = [...color.images];
                                                                    newImgs.splice(i, 1);
                                                                    updateColor(colorIndex, { images: newImgs });
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
                                            <Label className="text-sm font-medium mb-3 block">Stock Levels & Sizes</Label>
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
                                                                    updateColor(colorIndex, { sizes: currentSizes });
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
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStock(colorIndex, size, parseInt(e.target.value) || 0)}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {colors.length === 0 && (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded border border-dashed">
                                Start by adding a color variant above.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function LinkButtonOnClick() { return null; }
function UploadIcon() { return <Plus className="w-3 h-3 mr-1" />; }
