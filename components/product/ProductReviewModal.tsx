"use client";

import { useState, useRef } from "react";
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
import { Star, Camera, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { uploadReviewImage } from "@/lib/cloudinary";

interface ProductReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    productImage: string | null;
    onReviewSubmitted: () => void;
}

const MAX_IMAGES = 5;

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
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remaining = MAX_IMAGES - selectedImages.length;
        if (remaining <= 0) {
            toast.error(`En fazla ${MAX_IMAGES} fotoğraf ekleyebilirsiniz`);
            return;
        }

        const newFiles = files.slice(0, remaining);
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        const validFiles = newFiles.filter((file) => {
            if (!allowedTypes.includes(file.type)) {
                toast.error(`"${file.name}" yalnızca JPG, PNG veya WebP olmalıdır`);
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`"${file.name}" 5MB'dan büyük`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
        setSelectedImages((prev) => [...prev, ...validFiles]);
        setImagePreviews((prev) => [...prev, ...newPreviews]);

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Lütfen bir puan seçin");
            return;
        }

        setSubmitting(true);

        try {
            let uploadedUrls: string[] = [];

            if (selectedImages.length > 0) {
                toast.info("Fotoğraflar yükleniyor...");
                const uploadPromises = selectedImages.map((file) =>
                    uploadReviewImage(file, productId)
                );
                const results = await Promise.all(uploadPromises);
                uploadedUrls = results.filter((url): url is string => url !== null);

                if (uploadedUrls.length !== selectedImages.length) {
                    toast.error("Bazı fotoğraflar yüklenemedi, lütfen tekrar deneyin");
                    setSubmitting(false);
                    return;
                }
            }

            const res = await fetch("/api/product-reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    rating,
                    comment,
                    images: uploadedUrls,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    toast.error("Bu ürün için zaten yorum yapmışsınız.");
                    handleClose();
                    return;
                }
                throw new Error(data.error || "Bir hata oluştu");
            }

            if (data.pendingApproval) {
                toast.success("Fotoğraflı yorumunuz admin onayına gönderildi");
            } else {
                toast.success("Yorumunuz başarıyla gönderildi");
            }
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
        imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        setSelectedImages([]);
        setImagePreviews([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

                    <div className="space-y-2">
                        <Label>Fotoğraf Ekle (İsteğe bağlı)</Label>
                        <p className="text-xs text-muted-foreground">
                            Fotoğraflı yorumlar admin onayından sonra yayınlanır. En fazla {MAX_IMAGES} fotoğraf.
                        </p>

                        {imagePreviews.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                        <Image
                                            src={preview}
                                            alt={`Fotoğraf ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedImages.length < MAX_IMAGES && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors w-full justify-center"
                            >
                                <Camera className="w-4 h-4" />
                                Fotoğraf Seç
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={handleClose} disabled={submitting}>
                            Vazgeç
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                "Yorumu Gönder"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
