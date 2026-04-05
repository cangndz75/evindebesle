import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export type SizeType = "letter" | "number" | "cup";

export const SIZE_OPTIONS: Record<SizeType, string[]> = {
    letter: ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    number: ["32", "34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54"],
    cup: ["75A", "75B", "75C", "80A", "80B", "80C", "85B", "85C", "90B", "90C"]
};

interface ProductSizeStockProps {
    sizeType: SizeType;
    setSizeType: (value: SizeType) => void;
    mainStock: { [size: string]: number };
    setMainStock: (value: { [size: string]: number }) => void;
    isVariable: boolean;
    mainColorName: string | undefined;
    setMainColorName: (value: string) => void;
    mainColorHex: string | undefined;
    setMainColorHex: (value: string) => void;
    isTrackInventory: boolean;
}

export function ProductSizeStock({
    sizeType,
    setSizeType,
    mainStock,
    setMainStock,
    isVariable,
    mainColorName,
    setMainColorName,
    mainColorHex,
    setMainColorHex,
    isTrackInventory
}: ProductSizeStockProps) {

    const sizes = SIZE_OPTIONS[sizeType];

    const updateStock = (size: string, qty: number) => {
        setMainStock({
            ...mainStock,
            [size]: qty
        });
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Beden ve Stok Yönetimi</h2>

            {/* Size Type Selection */}
            <div className="mb-6">
                <Label className="mb-2 block font-semibold text-gray-700">Beden Sistemi</Label>
                <div className="flex flex-wrap gap-4 mb-3">
                    {(Object.keys(SIZE_OPTIONS) as SizeType[]).map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                            <input
                                type="radio"
                                id={`size-type-${type}`}
                                name="sizeType"
                                value={type}
                                checked={sizeType === type}
                                onChange={() => setSizeType(type)}
                                className="text-black focus:ring-black border-gray-300"
                            />
                            <Label htmlFor={`size-type-${type}`} className="capitalize cursor-pointer font-normal">
                                {type === 'letter' ? 'Harf (S, M, L)' : type === 'number' ? 'Numara (36, 38)' : 'Kup (75B, 80C)'}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Product / First Variant Configuration */}
            {isTrackInventory ? (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">

                    {/* Always ask for Main Color Name & Hex */}
                    <div className="mb-4 p-4 bg-gray-50 border border-gray-100 rounded-md">
                        <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                            Ana Ürün Rengi ve Kodu
                        </Label>
                        <p className="text-xs text-gray-500 mb-3">
                            Ürün tek renk olsa bile, ileride varyant eklenmesi durumunda bu bilgiler kullanılacaktır.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs mb-1.5 block font-medium">Renk Adı</Label>
                                <Input
                                    placeholder="Örn: Siyah, Lacivert"
                                    value={mainColorName || ""}
                                    onChange={(e) => setMainColorName(e.target.value)}
                                    className="bg-white text-black"
                                />
                            </div>
                            <div>
                                <Label className="text-xs mb-1.5 block font-medium">Renk Kodu (Hex)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        className="w-12 h-10 p-1 cursor-pointer bg-white"
                                        value={(/^#[0-9A-Fa-f]{6}$/.test(mainColorHex || "")) ? mainColorHex : "#000000"}
                                        onChange={(e) => setMainColorHex(e.target.value)}
                                    />
                                    <Input
                                        placeholder="#000000"
                                        value={mainColorHex || "#"}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (val.length > 7) return;
                                            setMainColorHex(val);
                                        }}
                                        className="uppercase bg-white font-mono text-black"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Label className="text-sm font-medium mb-3 block">
                        {isVariable ? `Stok Adetleri (${mainColorName || "Ana Renk"})` : "Ürün Stok Adetleri"}
                    </Label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {sizes.map(size => (
                            <div key={size} className="bg-gray-50 p-2 rounded border border-gray-100 flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-700">{size}</span>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="h-8 text-sm px-2 bg-white"
                                    value={mainStock[size] || ""}
                                    onChange={(e) => updateStock(size, parseInt(e.target.value) || 0)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">Stok takibi kapalı.</p>
            )}
        </div>
    );
}
