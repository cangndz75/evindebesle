"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface StockUpdateModalProps {
    productId: string;
    isOpen: boolean;
    onClose: () => void;
}

type ProductDetail = {
    id: string;
    name: string;
    colors: Array<{
        id: string;
        name: string;
        images?: string; // Optional images specific to color
    }>;
    sizes: Array<{
        id: string;
        name: string;
        stock: number; // For size-only products
    }>;
    variants: Array<{
        id: string;
        colorId: string;
        sizeId: string;
        size: { name: string };
        color: { name: string };
        stock: number;
    }>;
};

export default function StockUpdateModal({
    productId,
    isOpen,
    onClose,
}: StockUpdateModalProps) {
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && productId) {
            fetchProductDetails();
        }
    }, [isOpen, productId]);

    const fetchProductDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/products/${productId}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data.product);

                const initialStocks: Record<string, number> = {};
                if (data.product.variants.length > 0) {
                    data.product.variants.forEach((v: any) => initialStocks[v.id] = v.stock);
                } else {
                    data.product.sizes.forEach((s: any) => initialStocks[s.id] = s.stock);
                }
                setStockUpdates(initialStocks);
            }
        } catch (error) {
            toast.error("Ürün detayları yüklenemedi");
        } finally {
            setLoading(false);
        }
    };

    const handleStockChange = (id: string, value: string) => {
        const num = parseInt(value);
        if (!isNaN(num) && num >= 0) {
            setStockUpdates((prev) => ({ ...prev, [id]: num }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = Object.entries(stockUpdates).map(([id, stock]) => {
                const isVariant = product?.variants && product.variants.length > 0;
                return {
                    variantId: id,
                    isVariant,
                    stock
                };
            });


            const promises = updates.map(u =>
                fetch("/api/admin/products/stock-update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(u)
                })
            );

            await Promise.all(promises);

            toast.success("Stoklar güncellendi");
            onClose();
        } catch (error) {
            toast.error("Güncelleme sırasında hata");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Stok Güncelleme</DialogTitle>
                    <DialogDescription>
                        {product?.name} varyant stoklarını düzenleyin.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : !product ? (
                    <div className="text-center p-4">Ürün yüklenemedi</div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* If product has colors, group by Color */}
                        {product.colors.length > 0 ? (
                            product.colors.map(color => (
                                <div key={color.id} className="border rounded-lg p-4 bg-gray-50">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: "#000" /* Should have hex */ }}></span>
                                        {color.name}
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {product.variants
                                            .filter(v => v.colorId === color.id)
                                            .map(variant => (
                                                <div key={variant.id} className="bg-white p-3 rounded border">
                                                    <Label className="text-xs text-gray-500 mb-1 block">
                                                        {variant.size.name}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={stockUpdates[variant.id] ?? 0}
                                                        onChange={(e) => handleStockChange(variant.id, e.target.value)}
                                                    />
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {product.sizes.map(size => (
                                    <div key={size.id} className="bg-white p-3 rounded border">
                                        <Label className="text-xs text-gray-500 mb-1 block">
                                            {size.name}
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stockUpdates[size.id] ?? 0}
                                            onChange={(e) => handleStockChange(size.id, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        İptal
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Değişiklikleri Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
