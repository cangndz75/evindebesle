"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, ChevronRight, ChevronLeft, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Return reason options
const RETURN_REASONS = [
    { value: "WRONG_SIZE", label: "Beden uygun değil" },
    { value: "WRONG_COLOR", label: "Renk beklediğim gibi değil" },
    { value: "DAMAGED", label: "Ürün hasarlı geldi" },
    { value: "WRONG_PRODUCT", label: "Yanlış ürün gönderildi" },
    { value: "NOT_AS_DESCRIBED", label: "Ürün açıklamayla uyuşmuyor" },
    { value: "CHANGED_MIND", label: "Fikir değişikliği" },
    { value: "OTHER", label: "Diğer" },
];

interface OrderItem {
    id: string;
    productName: string;
    colorName: string | null;
    sizeName: string | null;
    quantity: number;
    image: string | null;
    product: {
        id: string;
        name: string;
        image: string | null;
    };
}

interface Order {
    id: string;
    orderNumber: string;
    items: OrderItem[];
}

interface SelectedItem {
    orderItemId: string;
    quantity: number;
    reason: string;
}

interface ReturnRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onSuccess?: () => void;
}

export default function ReturnRequestModal({
    isOpen,
    onClose,
    order,
    onSuccess,
}: ReturnRequestModalProps) {
    const [step, setStep] = useState(1);
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [generalReason, setGeneralReason] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setSelectedItems([]);
            setGeneralReason("");
            setDescription("");
        }
    }, [isOpen]);

    const toggleItemSelection = (itemId: string, maxQuantity: number) => {
        setSelectedItems((prev) => {
            const existing = prev.find((i) => i.orderItemId === itemId);
            if (existing) {
                return prev.filter((i) => i.orderItemId !== itemId);
            }
            return [...prev, { orderItemId: itemId, quantity: maxQuantity, reason: "" }];
        });
    };

    const updateItemQuantity = (itemId: string, quantity: number) => {
        setSelectedItems((prev) =>
            prev.map((item) =>
                item.orderItemId === itemId ? { ...item, quantity } : item
            )
        );
    };

    const updateItemReason = (itemId: string, reason: string) => {
        setSelectedItems((prev) =>
            prev.map((item) =>
                item.orderItemId === itemId ? { ...item, reason } : item
            )
        );
    };

    const handleSubmit = async () => {
        if (!order) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/returns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: order.id,
                    reason: generalReason,
                    description: description || undefined,
                    items: selectedItems,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Bir hata oluştu");
            }

            toast.success("İade talebiniz başarıyla oluşturuldu");
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "İade talebi oluşturulurken hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceedStep1 = selectedItems.length > 0;
    const canProceedStep2 = generalReason !== "";

    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        İade Talebi Oluştur
                    </DialogTitle>
                    <DialogDescription>
                        Sipariş No: <span className="font-semibold">{order.orderNumber}</span>
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 py-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                    step === s
                                        ? "bg-black text-white"
                                        : step > s
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-200 text-gray-500"
                                )}
                            >
                                {step > s ? <Check className="h-4 w-4" /> : s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={cn(
                                        "w-12 h-0.5 mx-1",
                                        step > s ? "bg-green-500" : "bg-gray-200"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Select Items */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <AlertCircle className="h-4 w-4" />
                            İade etmek istediğiniz ürünleri seçin
                        </div>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                            {order.items.map((item) => {
                                const isSelected = selectedItems.some((i) => i.orderItemId === item.id);
                                const selectedItem = selectedItems.find((i) => i.orderItemId === item.id);

                                return (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                                            isSelected ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                                        )}
                                    >
                                        <Checkbox
                                            id={`item-${item.id}`}
                                            checked={isSelected}
                                            onCheckedChange={() => toggleItemSelection(item.id, item.quantity)}
                                            className="mt-1"
                                        />
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.image || item.product.image ? (
                                                <img
                                                    src={item.image || item.product.image || ""}
                                                    alt={item.productName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Label
                                                htmlFor={`item-${item.id}`}
                                                className="font-medium cursor-pointer block"
                                            >
                                                {item.productName}
                                            </Label>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {item.colorName && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {item.colorName}
                                                    </Badge>
                                                )}
                                                {item.sizeName && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {item.sizeName}
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-xs">
                                                    {item.quantity} adet
                                                </Badge>
                                            </div>

                                            {/* Quantity and Reason (if selected) */}
                                            {isSelected && (
                                                <div className="mt-3 space-y-2 pt-3 border-t">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs text-gray-500 w-16">Adet:</Label>
                                                        <Select
                                                            value={String(selectedItem?.quantity || item.quantity)}
                                                            onValueChange={(v) => updateItemQuantity(item.id, parseInt(v))}
                                                        >
                                                            <SelectTrigger className="w-20 h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: item.quantity }, (_, i) => i + 1).map((n) => (
                                                                    <SelectItem key={n} value={String(n)}>
                                                                        {n}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs text-gray-500 w-16">Neden:</Label>
                                                        <Select
                                                            value={selectedItem?.reason || ""}
                                                            onValueChange={(v) => updateItemReason(item.id, v)}
                                                        >
                                                            <SelectTrigger className="flex-1 h-8">
                                                                <SelectValue placeholder="Seçiniz (opsiyonel)" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {RETURN_REASONS.map((r) => (
                                                                    <SelectItem key={r.value} value={r.value}>
                                                                        {r.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 2: General Reason & Description */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <Label className="mb-2 block">Genel İade Nedeni *</Label>
                            <Select value={generalReason} onValueChange={setGeneralReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="İade nedeninizi seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RETURN_REASONS.map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-2 block">Açıklama (Opsiyonel)</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="İade talebiniz hakkında detaylı bilgi verebilirsiniz..."
                                className="min-h-[120px]"
                            />
                        </div>
                    </div>
                )}

                {/* Step 3: Summary & Confirm */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <h4 className="font-semibold text-sm">İade Özeti</h4>
                            <div className="space-y-2">
                                {selectedItems.map((si) => {
                                    const item = order.items.find((i) => i.id === si.orderItemId);
                                    if (!item) return null;
                                    return (
                                        <div key={si.orderItemId} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">{item.productName}</span>
                                            <Badge variant="secondary">{si.quantity} adet</Badge>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="pt-3 border-t space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">İade Nedeni:</span>
                                    <span className="font-medium">
                                        {RETURN_REASONS.find((r) => r.value === generalReason)?.label}
                                    </span>
                                </div>
                                {description && (
                                    <div className="pt-2">
                                        <span className="text-gray-500 block mb-1">Açıklama:</span>
                                        <p className="text-gray-700 text-sm bg-white p-2 rounded border">{description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <p>
                                İade talebiniz onaylandıktan sonra size kargo bilgileri ile birlikte e-posta gönderilecektir.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                    {step > 1 && (
                        <Button
                            variant="outline"
                            onClick={() => setStep((s) => s - 1)}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Geri
                        </Button>
                    )}
                    <div className="flex-1" />
                    {step < 3 ? (
                        <Button
                            onClick={() => setStep((s) => s + 1)}
                            disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                            className="w-full sm:w-auto"
                        >
                            İleri
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Talebi Gönder
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
