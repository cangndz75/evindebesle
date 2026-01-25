"use client";

import { useState, useEffect } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, X, GripVertical } from "lucide-react";

interface ProductBlockInspectorProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
}

interface ProductItem {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image?: string;
    slug?: string;
}

interface ProductFromDB {
    id: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    primaryImage?: string | null;
    slug?: string | null;
}

export default function ProductBlockInspector({
    block,
    onUpdate,
}: ProductBlockInspectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ProductFromDB[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const products: ProductItem[] = block.content.products || [];

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

    const searchProducts = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `/api/admin/products/search?q=${encodeURIComponent(query)}`
            );
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.products || []);
            }
        } catch (error) {
            console.error("Error searching products:", error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            searchProducts(searchQuery);
        }, 300);

        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const addProduct = (product: ProductFromDB) => {
        const newProduct: ProductItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice ?? undefined,
            image: product.primaryImage ?? undefined,
            slug: product.slug ?? undefined,
        };

        const alreadyAdded = products.some((p) => p.id === product.id);
        if (!alreadyAdded) {
            updateContent("products", [...products, newProduct]);
        }
        setIsDialogOpen(false);
        setSearchQuery("");
        setSearchResults([]);
    };

    const removeProduct = (productId: string) => {
        updateContent(
            "products",
            products.filter((p) => p.id !== productId)
        );
    };

    const moveProduct = (index: number, direction: "up" | "down") => {
        const newProducts = [...products];
        const targetIndex = direction === "up" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newProducts.length) return;

        [newProducts[index], newProducts[targetIndex]] = [
            newProducts[targetIndex],
            newProducts[index],
        ];

        updateContent("products", newProducts);
    };

    return (
        <div className="space-y-4">
            {/* Ürün Listesi */}
            <div>
                <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Seçili Ürünler ({products.length})
                </Label>

                {products.length === 0 ? (
                    <div className="text-sm text-gray-500 italic py-4 text-center border border-dashed rounded-lg">
                        Henüz ürün eklenmedi
                    </div>
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {products.map((product, index) => (
                            <div
                                key={product.id}
                                className="flex items-center gap-2 bg-gray-50 rounded-lg p-2"
                            >
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        onClick={() => moveProduct(index, "up")}
                                        disabled={index === 0}
                                        className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                                    >
                                        <GripVertical className="w-3 h-3" />
                                    </button>
                                </div>
                                {product.image && (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-10 h-10 object-cover rounded"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{product.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {product.price.toLocaleString("tr-TR")} TL
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeProduct(product.id)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Ürün Ekle Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full mt-2" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Ürün Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Ürün Seç</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Ürün ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {isSearching ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    Aranıyor...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => addProduct(product)}
                                            className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left"
                                            disabled={products.some((p) => p.id === product.id)}
                                        >
                                            {product.primaryImage && (
                                                <img
                                                    src={product.primaryImage}
                                                    alt={product.name}
                                                    className="w-12 h-12 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {product.price.toLocaleString("tr-TR")} TL
                                                </p>
                                            </div>
                                            {products.some((p) => p.id === product.id) && (
                                                <span className="text-xs text-green-600">Eklendi</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : searchQuery ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    Ürün bulunamadı
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    Ürün aramak için yazın
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Kolon Sayısı */}
            <div>
                <Label className="text-xs font-medium text-gray-700">Kolon Sayısı</Label>
                <Select
                    value={String(block.content.columns || 3)}
                    onValueChange={(value) => updateContent("columns", parseInt(value))}
                >
                    <SelectTrigger className="mt-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2">2 Kolon</SelectItem>
                        <SelectItem value="3">3 Kolon</SelectItem>
                        <SelectItem value="4">4 Kolon</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Buton Metni */}
            <div>
                <Label className="text-xs font-medium text-gray-700">Buton Metni</Label>
                <Input
                    value={block.content.buttonText || "Sepete Ekle"}
                    onChange={(e) => updateContent("buttonText", e.target.value)}
                    placeholder="Sepete Ekle"
                    className="mt-1"
                />
            </div>

            {/* Buton Rengi */}
            <div>
                <Label className="text-xs font-medium text-gray-700">Buton Rengi</Label>
                <Input
                    type="color"
                    value={block.style.buttonColor || "#000000"}
                    onChange={(e) => updateStyle("buttonColor", e.target.value)}
                    className="mt-1 h-10"
                />
            </div>

            {/* Arka Plan Rengi */}
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

            {/* Togglelar */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-700">
                        Fiyatları Göster
                    </Label>
                    <Switch
                        checked={block.content.showPrices !== false}
                        onCheckedChange={(checked) => updateContent("showPrices", checked)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-700">
                        Butonu Göster
                    </Label>
                    <Switch
                        checked={block.content.showButton !== false}
                        onCheckedChange={(checked) => updateContent("showButton", checked)}
                    />
                </div>
            </div>
        </div>
    );
}
