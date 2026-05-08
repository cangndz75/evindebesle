"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface MyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage: string | null;
  review: ReviewData;
  onDeleted?: () => void;
}

export default function MyReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  review,
  onDeleted,
}: MyReviewModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/product-reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, productId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Yorum silinemedi");
      }

      toast.success("Yorumunuz silindi");
      onDeleted?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Yorum silinemedi");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yorumum</DialogTitle>
          <DialogDescription>Yorum detaylarınızı buradan görüntüleyebilir ve silebilirsiniz.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4 border-b border-gray-100">
          <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100 shrink-0">
            {productImage ? (
              <Image src={productImage} alt={productName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Görsel Yok</div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm line-clamp-2">{productName}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(review.createdAt).toLocaleString("tr-TR")}
            </p>
          </div>
        </div>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            ))}
            <Badge variant="secondary" className="ml-2">{review.rating}/5</Badge>
          </div>

          <div className="rounded-md border bg-gray-50 p-3 text-sm text-gray-700 min-h-17.5 whitespace-pre-wrap">
            {review.comment?.trim() ? review.comment : "Yorum metni yok."}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Kapat</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? "Siliniyor..." : "Yorumu Sil"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
