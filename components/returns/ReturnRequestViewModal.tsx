"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Copy, Check, Package, AlertCircle, Download, ExternalLink } from "lucide-react";

const RETURN_REASON_LABELS: Record<string, string> = {
    WRONG_SIZE: "Beden uygun değil",
    WRONG_COLOR: "Renk beklediğim gibi değil",
    DAMAGED: "Ürün hasarlı geldi",
    WRONG_PRODUCT: "Yanlış ürün gönderildi",
    NOT_AS_DESCRIBED: "Ürün açıklamayla uyuşmuyor",
    CHANGED_MIND: "Fikir değişikliği",
    OTHER: "Diğer",
};

const STATUS_CONFIG: Record<string, { label: string; className: string; description: string }> = {
    PENDING: {
        label: "Kargo Bekleniyor",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        description: "İade talebiniz oluşturuldu. Ürünü kargoya vermeniz bekleniyor.",
    },
    RECEIVED: {
        label: "Teslim Alındı",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Ürün depomuzda teslim alındı ve inceleniyor.",
    },
    APPROVED: {
        label: "Onaylandı",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
        description: "İade talebiniz onaylandı. Ücret iadesi işleme alındı.",
    },
    REJECTED: {
        label: "Reddedildi",
        className: "bg-red-100 text-red-800 border-red-200",
        description: "İade talebiniz reddedildi.",
    },
    REFUNDED: {
        label: "İade Edildi",
        className: "bg-green-100 text-green-800 border-green-200",
        description: "İade tutarı kartınıza yatırılmıştır.",
    },
    COMPLETED: {
        label: "Tamamlandı",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        description: "İade süreci tamamlanmıştır.",
    },
};

interface ReturnRequestItem {
    id: string;
    quantity: number;
    reason: string | null;
    orderItem: {
        productName: string;
        colorName: string | null;
        sizeName: string | null;
        image?: string | null;
        unitPrice?: number;
        totalPrice?: number;
    };
}

interface ReturnRequestData {
    id: string;
    orderId: string;
    status: string;
    reason: string;
    description: string | null;
    images?: string[];
    adminNote?: string | null;
    cargoTrackingCode?: string | null;
    cargoPdfUrl?: string | null;
    cargoTrackingUrl?: string | null;
    bankReferenceCode?: string | null;
    refundAmount?: number | null;
    receivedAt?: string | null;
    refundedAt?: string | null;
    createdAt: string;
    order: {
        orderNumber: string;
    };
    items: ReturnRequestItem[];
}

interface ReturnRequestViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ReturnRequestData | null;
    onCancelled?: () => void;
}

export default function ReturnRequestViewModal({
    isOpen,
    onClose,
    data,
    onCancelled,
}: ReturnRequestViewModalProps) {
    const [cancelling, setCancelling] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);

    if (!data) return null;

    const canCancel = data.status === "PENDING";
    const statusInfo = STATUS_CONFIG[data.status] || STATUS_CONFIG.PENDING;

    const handleCancel = async () => {
        setCancelling(true);
        try {
            const res = await fetch(`/api/returns/${data.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "cancel" }),
            });

            const payload = await res.text();
            if (!res.ok) throw new Error(payload || "İade iptal edilemedi");

            toast.success("İade talebiniz iptal edildi");
            onCancelled?.();
            onClose();
        } catch (error: any) {
            toast.error(error?.message || "İade iptal edilemedi");
        } finally {
            setCancelling(false);
        }
    };

    const handleCopyCode = async () => {
        if (!data.cargoTrackingCode) return;
        try {
            await navigator.clipboard.writeText(data.cargoTrackingCode);
            setCodeCopied(true);
            toast.success("Kargo kodu kopyalandı");
            setTimeout(() => setCodeCopied(false), 2000);
        } catch {
            toast.error("Panoya kopyalanamadı");
        }
    };

    const formatPrice = (v: number) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>İade Talebi Detayı</DialogTitle>
                    <DialogDescription>
                        Sipariş No: <span className="font-semibold">{data.order.orderNumber}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Status */}
                    <div className="bg-gray-50 rounded-lg p-4 border space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Durum</span>
                            <Badge className={`${statusInfo.className} border`}>{statusInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{statusInfo.description}</p>
                    </div>

                    {/* Kargo — bekleyen iadelerde kod, etiket ve takip */}
                    {data.status === "PENDING" &&
                        (data.cargoTrackingCode || data.cargoPdfUrl || data.cargoTrackingUrl) && (
                            <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                                    İade kargosu
                                </p>
                                {data.cargoTrackingCode && (
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs text-zinc-500">Kargo kodu</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-1.5 border-zinc-200 text-xs"
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
                                        <p className="mt-2 break-all text-center text-xl font-semibold tabular-nums tracking-tight text-zinc-900 sm:text-2xl">
                                            {data.cargoTrackingCode}
                                        </p>
                                    </div>
                                )}
                                {(data.cargoPdfUrl || data.cargoTrackingUrl) && (
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        {data.cargoPdfUrl && (
                                            <Button
                                                className="flex-1 gap-2 bg-zinc-900 text-white hover:bg-zinc-800"
                                                asChild
                                            >
                                                <a
                                                    href={data.cargoPdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Download className="h-4 w-4 shrink-0" />
                                                    İade etiketini indir
                                                </a>
                                            </Button>
                                        )}
                                        {data.cargoTrackingUrl && (
                                            <Button variant="outline" className="flex-1 gap-2 border-zinc-200" asChild>
                                                <a
                                                    href={data.cargoTrackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <ExternalLink className="h-4 w-4 shrink-0" />
                                                    Kargo durumunu takip et
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                )}
                                <p className="text-xs leading-relaxed text-zinc-500">
                                    Etiketi yazdırıp pakete yapıştırabilir veya şubede kargo kodunu iletebilirsiniz.
                                </p>
                            </div>
                        )}

                    {/* Refund Amount + bank reference */}
                    {data.status === "REFUNDED" && (data.refundAmount != null || data.bankReferenceCode) && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                            {data.refundAmount != null && (
                                <p className="text-sm text-green-800">
                                    <span className="font-semibold">{formatPrice(data.refundAmount)}</span> tutarında iade kartınıza yatırılmıştır.
                                    Bankanıza bağlı olarak 1-10 iş günü içinde hesabınıza yansıyacaktır.
                                </p>
                            )}
                            {data.bankReferenceCode && (
                                <p className="text-xs text-green-900 pt-1 border-t border-green-200">
                                    <span className="font-medium">Banka referansı:</span>{" "}
                                    <span className="font-mono break-all">{data.bankReferenceCode}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Rejection Reason */}
                    {data.status === "REJECTED" && data.adminNote && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-red-800 mb-1">Ret Nedeni</p>
                                    <p className="text-sm text-red-700">{data.adminNote}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="rounded-lg border p-4 space-y-2">
                        <p className="text-sm font-medium">Genel İade Nedeni</p>
                        <p className="text-sm text-gray-700">{RETURN_REASON_LABELS[data.reason] || data.reason}</p>
                        {data.description && (
                            <>
                                <p className="text-sm font-medium pt-2">Açıklama</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.description}</p>
                            </>
                        )}
                    </div>

                    {/* Items */}
                    <div className="rounded-lg border p-4 space-y-3">
                        <p className="text-sm font-medium">İade Edilen Ürünler</p>
                        {data.items.map((item) => (
                            <div key={item.id} className="rounded-md bg-gray-50 p-3 text-sm space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-gray-900">{item.orderItem.productName}</p>
                                    {item.orderItem.unitPrice && (
                                        <span className="text-sm font-semibold">
                                            {formatPrice(item.orderItem.unitPrice * item.quantity)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 text-gray-600">
                                    <span>Adet: {item.quantity}</span>
                                    {item.orderItem.colorName && <span>Renk: {item.orderItem.colorName}</span>}
                                    {item.orderItem.sizeName && <span>Beden: {item.orderItem.sizeName}</span>}
                                </div>
                                {item.reason && (
                                    <p className="text-gray-500">
                                        Neden: {RETURN_REASON_LABELS[item.reason] || item.reason}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Customer Photos */}
                    {data.images && data.images.length > 0 && (
                        <div className="rounded-lg border p-4">
                            <p className="text-sm font-medium mb-2">Yüklenen Görseller</p>
                            <div className="flex flex-wrap gap-2">
                                {data.images.map((url, idx) => (
                                    <img key={idx} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>Oluşturulma: {new Date(data.createdAt).toLocaleString("tr-TR")}</p>
                        {data.receivedAt && <p>Teslim Alınma: {new Date(data.receivedAt).toLocaleString("tr-TR")}</p>}
                        {data.refundedAt && <p>İade Tarihi: {new Date(data.refundedAt).toLocaleString("tr-TR")}</p>}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose}>Kapat</Button>
                    {canCancel && (
                        <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
                            {cancelling ? "İptal Ediliyor..." : "İade Talebini İptal Et"}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
