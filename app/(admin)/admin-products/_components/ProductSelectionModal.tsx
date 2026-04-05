"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Check, X, Filter } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Product = {
    id: string;
    name: string;
    image: string | null;
    price: number;
    stock: number;
    categoryId: string;
    category?: {
        name: string;
    };
    gender?: string;
};

type Category = {
    id: string;
    name: string;
};

interface ProductSelectionModalProps {
    selectedIds: string[];
    onSelect: (products: Product[]) => void;
    trigger?: React.ReactNode;
}

export default function ProductSelectionModal({ selectedIds, onSelect, trigger }: ProductSelectionModalProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/admin-categories");
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error("Kategoriler yüklenirken hata:", error);
            }
        };
        fetchCategories();
    }, []);

    const searchProducts = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (search) queryParams.set("search", search);
            if (categoryId) queryParams.set("categoryId", categoryId);

            const res = await fetch(`/api/admin-products?${queryParams.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Ürünler yüklenirken hata:", error);
            toast.error("Ürünler yüklenirken hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            searchProducts();
        }
    }, [open, categoryId]); // Kategori değişince otomatik ara

    useEffect(() => {
        const timer = setTimeout(() => {
            if (open) searchProducts();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const toggleSelection = (product: Product) => {
        const isSelected = selectedProducts.some(p => p.id === product.id) || selectedIds.includes(product.id);

        if (isSelected) {
            if (selectedProducts.some(p => p.id === product.id)) {
                setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
            } else {
                toast.warning("Bu ürün zaten ekli.");
            }
        } else {
            setSelectedProducts(prev => [...prev, product]);
        }
    };

    const handleConfirm = () => {
        onSelect(selectedProducts);
        setOpen(false);
        setSelectedProducts([]); // Reset selection after confirm
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="h-9">
                        <Plus className="w-4 h-4 mr-2" />
                        Ürün Ekle
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b">
                    <DialogTitle>Takımı Tamamla - Ürün Seçimi</DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    
                    <div className="w-64 border-r bg-gray-50 flex flex-col overflow-y-auto p-4 gap-2">
                        <div className="font-medium text-sm text-gray-500 mb-2">Kategoriler</div>
                        <Button
                            variant={categoryId === "" ? "secondary" : "ghost"}
                            className="justify-start text-left font-normal"
                            onClick={() => setCategoryId("")}
                        >
                            Tümü
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat.id}
                                variant={categoryId === cat.id ? "secondary" : "ghost"}
                                className="justify-start text-left font-normal truncate"
                                onClick={() => setCategoryId(cat.id)}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>

                    
                    <div className="flex-1 flex flex-col overflow-hidden">
                        
                        <div className="p-4 border-b flex gap-3 items-center bg-white">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Ürün adı, renk veya kod ile ara..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        
                        <div className="flex-1 overflow-y-auto p-4 content-start">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    Yükleniyor...
                                </div>
                            ) : products.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                                    <Search className="w-8 h-8 opacity-20" />
                                    <p>Ürün bulunamadı</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {products.map(product => {
                                        const isSelected = selectedIds.includes(product.id) || selectedProducts.some(p => p.id === product.id);
                                        return (
                                            <div
                                                key={product.id}
                                                className={cn(
                                                    "border rounded-lg overflow-hidden group cursor-pointer transition-all relative hover:shadow-md",
                                                    isSelected ? "border-green-500 bg-green-50/30" : "border-gray-200"
                                                )}
                                                onClick={() => toggleSelection(product)}
                                            >
                                                
                                                <div className={cn(
                                                    "absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm",
                                                    isSelected ? "bg-green-500 border-green-500" : "bg-white border-gray-200 group-hover:border-gray-400"
                                                )}>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                                </div>

                                                <div className="aspect-3/4 relative bg-gray-100">
                                                    {product.image ? (
                                                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Görsel Yok</div>
                                                    )}
                                                    
                                                    {product.stock <= 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1">
                                                            Tükendi
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="font-semibold text-sm">{product.price.toFixed(2)} ₺</span>
                                                        <span className="text-xs text-gray-500">{product.gender}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        
                        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {selectedProducts.length} yeni ürün seçildi
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                                <Button onClick={handleConfirm} disabled={selectedProducts.length === 0}>
                                    Seçilenleri Ekle ({selectedProducts.length})
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
