"use client";

import { useState, useEffect, useRef } from "react";
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
import {
    Loader2,
    Package,
    ChevronRight,
    ChevronLeft,
    Check,
    AlertCircle,
    Camera,
    X,
    Copy,
    CheckCircle,
    Download,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const RETURN_REASONS = [
    { value: "WRONG_SIZE", label: "Beden uygun değil" },
    { value: "WRONG_COLOR", label: "Renk beklediğim gibi değil" },
    { value: "DAMAGED", label: "Ürün hasarlı geldi" },
    { value: "WRONG_PRODUCT", label: "Yanlış ürün gönderildi" },
    { value: "NOT_AS_DESCRIBED", label: "Ürün açıklamayla uyuşmuyor" },
    { value: "CHANGED_MIND", label: "Fikir değişikliği" },
    { value: "OTHER", label: "Diğer" },
];

const DAMAGE_REASONS = ["DAMAGED", "WRONG_PRODUCT", "NOT_AS_DESCRIBED"];

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
    const [images, setImages] = useState<string[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{
        cargoTrackingCode: string | null;
        cargoCompany: string;
        cargoPdfUrl: string | null;
        cargoTrackingUrl: string | null;
    } | null>(null);
    const [codeCopied, setCodeCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setSelectedItems([]);
            setGeneralReason("");
            setDescription("");
            setImages([]);
            setResult(null);
            setCodeCopied(false);
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (images.length + files.length > 5) {
            toast.error("En fazla 5 görsel yükleyebilirsiniz");
            return;
        }

        setUploadingImage(true);

        for (const file of Array.from(files)) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name}: Dosya boyutu 10 MB'dan küçük olmalıdır`);
                continue;
            }

            try {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "Yükleme hatası");

                setImages((prev) => [...prev, data.url]);
            } catch (err: any) {
                toast.error(err.message || "Görsel yüklenirken hata oluştu");
            }
        }

        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeImage = (idx: number) => {
        setImages((prev) => prev.filter((_, i) => i !== idx));
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
                    images,
                    items: selectedItems,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Bir hata oluştu");
            }

            const data = await response.json();
            setResult({
                cargoTrackingCode: data.cargoTrackingCode ?? null,
                cargoCompany: data.cargoCompany,
                cargoPdfUrl: data.cargoPdfUrl ?? null,
                cargoTrackingUrl: data.cargoTrackingUrl ?? null,
            });
            setStep(4);
            toast.success("İade talebiniz başarıyla oluşturuldu");
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || "İade talebi oluşturulurken hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyCode = async () => {
        if (!result?.cargoTrackingCode) {
            toast.error("Kopyalanacak kod bulunamadı");
            return;
        }
        try {
            await navigator.clipboard.writeText(result.cargoTrackingCode);
            setCodeCopied(true);
            toast.success("Kargo kodu kopyalandı");
            setTimeout(() => setCodeCopied(false), 2000);
        } catch {
            toast.error("Panoya kopyalanamadı");
        }
    };

    const canProceedStep1 = selectedItems.length > 0 && generalReason !== "";
    const showImageUpload = DAMAGE_REASONS.includes(generalReason);
    const isSuccessStep = step === 4 && !!result;

    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle
                        className={cn(
                            "flex items-center gap-2",
                            isSuccessStep && "text-xl font-semibold tracking-tight text-zinc-800"
                        )}
                    >
                        {isSuccessStep ? (
                            <>
                                <CheckCircle className="h-5 w-5 shrink-0 text-zinc-900" strokeWidth={1.5} />
                                İade Talebiniz Alındı
                            </>
                        ) : (
                            <>
                                <Package className="h-5 w-5 shrink-0" />
                                İade Oluştur
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isSuccessStep ? (
                            <>
                                Sipariş{" "}
                                <span className="font-semibold text-zinc-900">#{order.orderNumber}</span> için iade
                                kaydınız oluşturuldu. Aşağıdan kargo bilgilerinize ulaşabilirsiniz.
                            </>
                        ) : (
                            <>
                                Sipariş No: <span className="font-semibold">{order.orderNumber}</span>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Step Indicator — başarı ekranında gizlenir */}
                {step < 4 && (
                    <div className="flex items-center justify-center gap-2 py-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                        step === s
                                            ? "bg-black text-white"
                                            : step > s
                                                ? "bg-zinc-900 text-white"
                                                : "bg-zinc-100 text-zinc-400"
                                    )}
                                >
                                    {step > s ? <Check className="h-4 w-4" /> : s}
                                </div>
                                {s < 3 && (
                                    <div
                                        className={cn(
                                            "w-12 h-0.5 mx-1",
                                            step > s ? "bg-zinc-900" : "bg-zinc-100"
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 1: Select Items & Reason */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <AlertCircle className="h-4 w-4" />
                            İade etmek istediğiniz ürünleri seçin
                        </div>
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
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
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
                                                    <Badge variant="secondary" className="text-xs">{item.colorName}</Badge>
                                                )}
                                                {item.sizeName && (
                                                    <Badge variant="secondary" className="text-xs">{item.sizeName}</Badge>
                                                )}
                                                <Badge variant="outline" className="text-xs">{item.quantity} adet</Badge>
                                            </div>

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
                                                                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
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
                                                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
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

                {/* STEP 2: Description + Photo Upload */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <Label className="mb-2 block">Açıklama (Opsiyonel)</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="İade talebiniz hakkında detaylı bilgi verebilirsiniz..."
                                className="min-h-[120px]"
                            />
                        </div>

                        {showImageUpload && (
                            <div>
                                <Label className="mb-2 block">Hasar / Sorun Görseli (Opsiyonel)</Label>
                                <p className="text-xs text-gray-500 mb-3">
                                    Ürünle ilgili sorunun görsellerini yükleyin (en fazla 5 adet)
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {images.map((url, idx) => (
                                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {images.length < 5 && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingImage}
                                            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50"
                                        >
                                            {uploadingImage ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Camera className="w-5 h-5" />
                                                    <span className="text-[10px] mt-1">Ekle</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: Summary */}
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
                                {images.length > 0 && (
                                    <div className="pt-2">
                                        <span className="text-gray-500 block mb-1">Yüklenen Görseller:</span>
                                        <div className="flex gap-2">
                                            {images.map((url, idx) => (
                                                <img key={idx} src={url} alt="" className="w-12 h-12 object-cover rounded border" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-sm text-zinc-600">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-zinc-400" />
                            <p>
                                Onay sonrası kargo kodu, varsa PDF etiket ve takip linki e-postanıza da gönderilir.
                            </p>
                        </div>
                    </div>
                )}

                {/* STEP 4: Başarı — sade, vurgulu kargo bilgisi */}
                {step === 4 && result && (
                    <div className="space-y-6">
                        <div className="text-center pt-1">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm">
                                <CheckCircle className="h-7 w-7 text-zinc-900" strokeWidth={1.5} />
                            </div>
                            <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-500">
                                Paketinizi kargoya vermek için aşağıdaki kodu şubede iletebilir veya etiketi
                                yazdırabilirsiniz. Özet ayrıca e-postanıza gönderildi.
                            </p>
                        </div>

                        <div className="rounded-xl border border-zinc-200 bg-zinc-50/40 px-4 py-3 text-center text-xs text-zinc-500">
                            Taşıyıcı: <span className="font-medium text-zinc-800">{result.cargoCompany}</span>
                        </div>

                        {result.cargoTrackingCode ? (
                            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                                        İade kargo kodu
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5 border-zinc-200 text-xs text-zinc-700"
                                        onClick={handleCopyCode}
                                    >
                                        {codeCopied ? (
                                            <>
                                                <Check className="h-3.5 w-3.5" />
                                                Kopyalandı
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5" />
                                                Kopyala
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <p className="mt-3 break-all text-center text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 sm:text-3xl">
                                    {result.cargoTrackingCode}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-6 text-center text-sm text-zinc-500">
                                Kargo kodu bu oturumda oluşturulamadı; etiket veya e-postanızdaki bilgileri kullanın.
                            </div>
                        )}

                        {(result.cargoPdfUrl || result.cargoTrackingUrl) && (
                            <div className="flex flex-col gap-2 sm:flex-row">
                                {result.cargoPdfUrl ? (
                                    <Button
                                        className="flex-1 gap-2 bg-zinc-900 text-white hover:bg-zinc-800"
                                        asChild
                                    >
                                        <a
                                            href={result.cargoPdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Download className="h-4 w-4 shrink-0" />
                                            İade etiketini indir
                                        </a>
                                    </Button>
                                ) : null}
                                {result.cargoTrackingUrl ? (
                                    <Button variant="outline" className="flex-1 gap-2 border-zinc-200" asChild>
                                        <a
                                            href={result.cargoTrackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="h-4 w-4 shrink-0" />
                                            Kargo durumunu takip et
                                        </a>
                                    </Button>
                                ) : null}
                            </div>
                        )}

                        <div className="flex items-start gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3.5 py-3 text-xs leading-relaxed text-zinc-600">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                            <p>
                                Ürün depomuza ulaştığında inceleme yapılır; onay sonrası ücret iadesi kartınıza
                                yansıtılır. Süreci siparişlerim sayfasından takip edebilirsiniz.
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                {step < 4 && (
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
                                disabled={step === 1 ? !canProceedStep1 : false}
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
                )}

                {step === 4 && (
                    <DialogFooter className="pt-4">
                        <Button onClick={onClose} className="w-full sm:w-auto">
                            Tamam
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
