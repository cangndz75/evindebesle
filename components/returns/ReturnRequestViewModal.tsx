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

const RETURN_REASON_LABELS: Record<string, string> = {
  WRONG_SIZE: "Beden uygun değil",
  WRONG_COLOR: "Renk beklediğim gibi değil",
  DAMAGED: "Ürün hasarlı geldi",
  WRONG_PRODUCT: "Yanlış ürün gönderildi",
  NOT_AS_DESCRIBED: "Ürün açıklamayla uyuşmuyor",
  CHANGED_MIND: "Fikir değişikliği",
  OTHER: "Diğer",
};

interface ReturnRequestItem {
  id: string;
  quantity: number;
  reason: string | null;
  orderItem: {
    productName: string;
    colorName: string | null;
    sizeName: string | null;
  };
}

interface ReturnRequestData {
  id: string;
  status: string;
  reason: string;
  description: string | null;
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

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Bekliyor", className: "bg-yellow-100 text-yellow-800" },
    APPROVED: { label: "Onaylandı", className: "bg-green-100 text-green-800" },
    REJECTED: { label: "İptal/Red", className: "bg-red-100 text-red-800" },
    COMPLETED: { label: "Tamamlandı", className: "bg-blue-100 text-blue-800" },
  };
  const item = map[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  return <Badge className={item.className}>{item.label}</Badge>;
}

export default function ReturnRequestViewModal({
  isOpen,
  onClose,
  data,
  onCancelled,
}: ReturnRequestViewModalProps) {
  const [cancelling, setCancelling] = useState(false);

  if (!data) return null;

  const canCancel = data.status === "PENDING";

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/returns/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const payload = await res.text();
      if (!res.ok) {
        throw new Error(payload || "İade iptal edilemedi");
      }

      toast.success("İade talebiniz iptal edildi");
      onCancelled?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "İade iptal edilemedi");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-160 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>İade Talebi Detayı</DialogTitle>
          <DialogDescription>
            Sipariş No: <span className="font-semibold">{data.order.orderNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 border">
            <div className="text-sm text-gray-600">Durum</div>
            {getStatusBadge(data.status)}
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-sm font-medium">Genel İade Nedeni</p>
            <p className="text-sm text-gray-700">{RETURN_REASON_LABELS[data.reason] || data.reason}</p>
            {data.description && (
              <>
                <p className="text-sm font-medium pt-2">Açıklama</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.description}</p>
              </>
            )}
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <p className="text-sm font-medium">İade Edilen Ürünler</p>
            {data.items.map((item) => (
              <div key={item.id} className="rounded-md bg-gray-50 p-3 text-sm space-y-1">
                <p className="font-medium text-gray-900">{item.orderItem.productName}</p>
                <p className="text-gray-600">Adet: {item.quantity}</p>
                <p className="text-gray-600">
                  {(item.orderItem.colorName || item.orderItem.sizeName)
                    ? `Renk: ${item.orderItem.colorName || "-"} • Beden: ${item.orderItem.sizeName || "-"}`
                    : ""}
                </p>
                {item.reason && (
                  <p className="text-gray-600">
                    Ürün Nedeni: {RETURN_REASON_LABELS[item.reason] || item.reason}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500">
            Oluşturulma: {new Date(data.createdAt).toLocaleString("tr-TR")}
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
