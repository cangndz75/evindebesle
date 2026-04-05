"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Star } from "lucide-react";
import Image from "next/image";

interface ProductReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    productImage: string | null;
    onReviewSubmitted: () => void;
}

export default function ProductReviewModal({
    isOpen,
    onClose,
    productId,
    productName,
    productImage,
    onReviewSubmitted,
}: ProductReviewModalProps) {
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [hoverRating, setHoverRating] = useState<number>(0);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Lütfen bir puan seçin");
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch("/api/product-reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    rating,
                    comment,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Bir hata oluştu");
            }

            toast.success("Yorumunuz başarıyla gönderildi");
            onReviewSubmitted();
            handleClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setComment("");
        setHoverRating(0);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Ürünü Değerlendir</DialogTitle>
                    <DialogDescription>
                        Aldığınız ürün hakkında düşüncelerinizi paylaşın.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-4 py-4 border-b border-gray-100">
                    <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        {productImage ? (
                            <Image
                                src={productImage}
                                alt={productName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                Görsel Yok
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium text-sm line-clamp-2">{productName}</h3>
                    </div>
                </div>

                <div className="space-y-6 pt-4">
                    
                    <div className="flex flex-col items-center gap-2">
                        <Label>Puanınız</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= (hoverRating || rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <span className="text-sm font-medium text-yellow-600">
                                {rating === 5 && "Harika!"}
                                {rating === 4 && "Çok İyi"}
                                {rating === 3 && "İyi"}
                                {rating === 2 && "İdare Eder"}
                                {rating === 1 && "Kötü"}
                            </span>
                        )}
                    </div>

                    
                    <div className="space-y-2">
                        <Label htmlFor="comment">Yorumunuz (İsteğe bağlı)</Label>
                        <Textarea
                            id="comment"
                            placeholder="Ürün hakkındaki deneyimlerinizi yazın..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={handleClose} disabled={submitting}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
                            {submitting ? "Gönderiliyor..." : "Yorumu Gönder"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
