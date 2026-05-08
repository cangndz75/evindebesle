"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Package, User, MapPin } from "lucide-react";
import Image from "next/image";

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any; // Type should match the one in columns.tsx but for simplicity using any temporarily
}

export function TransactionDetailModal({
    isOpen,
    onClose,
    transaction,
}: TransactionDetailModalProps) {
    if (!transaction) return null;

    const fullyMask = (value: string | null | undefined) => {
        if (!value) return "********";
        return "*".repeat(Math.max(8, Math.min(16, value.length)));
    };

    const maskNameToInitials = (name: string | null | undefined) => {
        if (!name) return "--";
        const parts = name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 0) return "--";

        return parts
            .slice(0, 2)
            .map((part) => `${part[0]?.toUpperCase()}.`)
            .join(" ");
    };

    const getPaymentStatusLabel = (status: string) => {
        const statusMap: Record<string, string> = {
            PAID: "Ödendi",
            SUCCESS: "Ödendi",
            SUCCEEDED: "Ödendi",
            PAYMENT_SUCCESS: "Ödendi",
            PENDING: "Ödeme Bekleniyor",
            PENDING_PAYMENT: "Ödeme Bekleniyor",
            FAILED: "Ödeme Başarısız",
            PAYMENT_FAILED: "Ödeme Başarısız",
            PAYMENT_CAPTURE_FAILED: "Ödeme Tahsilatı Başarısız",
            REFUNDED: "İade Edildi",
        };
        return statusMap[status] || status;
    };

    const formattedTotal = new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
    }).format(transaction.total);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">
                                İşlem Detayı #{transaction.orderNumber}
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                {format(new Date(transaction.createdAt), "d MMMM yyyy HH:mm", {
                                    locale: tr,
                                })}
                            </DialogDescription>
                        </div>
                        <Badge
                            variant={
                                ["PAID", "SUCCESS", "SUCCEEDED", "PAYMENT_SUCCESS"].includes(transaction.paymentStatus)
                                    ? "outline"
                                    : "secondary"
                            }
                            className={
                                ["PAID", "SUCCESS", "SUCCEEDED", "PAYMENT_SUCCESS"].includes(transaction.paymentStatus)
                                    ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                                    : ["PENDING", "PENDING_PAYMENT"].includes(transaction.paymentStatus)
                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"
                                    : ["FAILED", "PAYMENT_FAILED", "PAYMENT_CAPTURE_FAILED"].includes(transaction.paymentStatus)
                                    ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
                                    : transaction.paymentStatus === "REFUNDED"
                                    ? "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200"
                                    : ""
                            }
                        >
                            {getPaymentStatusLabel(transaction.paymentStatus)}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <User className="h-4 w-4" />
                                Müşteri Bilgileri
                            </div>
                            <div className="rounded-lg border p-4 text-sm">
                                <div className="font-medium">{maskNameToInitials(transaction.user?.name || "")}</div>
                                <div className="text-muted-foreground">{fullyMask(transaction.email || transaction.user?.email)}</div>
                                {transaction.user?.phone && <div className="text-muted-foreground mt-1">{fullyMask(transaction.user.phone)}</div>}
                            </div>
                        </div>

                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <CreditCard className="h-4 w-4" />
                                Ödeme Bilgileri
                            </div>
                            <div className="rounded-lg border p-4 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Yöntem:</span>
                                    <span className="font-medium">{transaction.paymentMethod || "Kredi Kartı"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tutar:</span>
                                    <span className="font-medium">{formattedTotal}</span>
                                </div>
                                {transaction.payment?.provider && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sağlayıcı:</span>
                                        <span className="font-medium">{transaction.payment.provider}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                Teslimat Adresi
                            </div>
                            <div className="rounded-lg border p-4 text-sm">
                                {transaction.shippingAddress ? (
                                    <>
                                        <div className="font-medium">{fullyMask(transaction.shippingAddress.title)}</div>
                                        <div className="text-muted-foreground whitespace-pre-wrap">
                                            {fullyMask(transaction.shippingAddress.fullAddress)}
                                        </div>
                                        <div className="text-muted-foreground mt-1">
                                            {fullyMask(transaction.shippingAddress.districtId)}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-muted-foreground">Adres bilgisi bulunamadı</div>
                                )}
                            </div>
                        </div>

                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                Fatura Adresi
                            </div>
                            <div className="rounded-lg border p-4 text-sm">
                                {transaction.billingAddress ? (
                                    <>
                                        <div className="font-medium">{fullyMask(transaction.billingAddress.title)}</div>
                                        <div className="text-muted-foreground whitespace-pre-wrap">
                                            {fullyMask(transaction.billingAddress.fullAddress)}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-muted-foreground">Adres bilgisi bulunamadı</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <Package className="h-4 w-4" />
                            Sipariş İçeriği
                        </div>
                        <div className="rounded-lg border divide-y">
                            {transaction.items?.map((item: any) => (
                                <div key={item.id} className="p-4 flex items-center gap-4">
                                    <div className="h-16 w-16 relative rounded-md overflow-hidden bg-gray-100 shrink-0">
                                        {item.product?.image || item.image ? (
                                            <Image
                                                src={item.product?.image || item.image}
                                                alt={item.productName}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                                No Img
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{item.productName}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {item.quantity} adet x {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(item.unitPrice)}
                                        </div>
                                        {(item.colorName || item.sizeName) && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {item.colorName} {item.sizeName ? ` - ${item.sizeName}` : ""}
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-semibold">
                                        {new Intl.NumberFormat("tr-TR", {
                                            style: "currency",
                                            currency: "TRY",
                                        }).format(item.totalPrice)}
                                    </div>
                                </div>
                            ))}
                            <div className="p-4 flex justify-end bg-gray-50 rounded-b-lg">
                                <div className="text-right">
                                    <span className="text-muted-foreground mr-2">Toplam:</span>
                                    <span className="font-bold text-lg">{formattedTotal}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
