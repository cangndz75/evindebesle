"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Star,
    Check,
    Trash2,
    Loader2,
    Image as ImageIcon,
    Eye,
    X,
    Filter,
    Clock,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";

type ReviewStatus = "all" | "pending" | "approved";

interface ReviewProduct {
    id: string;
    name: string;
    image: string | null;
    slug: string | null;
}

interface Review {
    id: string;
    productId: string;
    userId: string | null;
    userName: string | null;
    rating: number;
    comment: string | null;
    images: string[];
    hasImages: boolean;
    isApproved: boolean;
    createdAt: string;
    product: ReviewProduct;
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<ReviewStatus>("pending");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [previewImages, setPreviewImages] = useState<string[] | null>(null);
    const [previewIndex, setPreviewIndex] = useState(0);

    const fetchReviews = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin-reviews?status=${statusFilter}`);
            const data = await res.json();
            if (res.ok) {
                setReviews(data.reviews || []);
                setPendingCount(data.pendingCount || 0);
            }
        } catch {
            toast.error("Yorumlar yüklenirken hata oluştu");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        setLoading(true);
        fetchReviews();
    }, [fetchReviews]);

    const handleApprove = async (reviewId: string) => {
        setActionLoading(reviewId);
        try {
            const res = await fetch(`/api/admin-products/reviews/${reviewId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isApproved: true }),
            });

            if (res.ok) {
                toast.success("Yorum onaylandı");
                fetchReviews();
            } else {
                toast.error("Yorum onaylanırken hata oluştu");
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;

        setActionLoading(reviewId);
        try {
            const res = await fetch(`/api/admin-products/reviews/${reviewId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Yorum silindi");
                fetchReviews();
            } else {
                toast.error("Yorum silinirken hata oluştu");
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setActionLoading(null);
        }
    };

    const openImagePreview = (images: string[], index: number = 0) => {
        setPreviewImages(images);
        setPreviewIndex(index);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const statusTabs: { key: ReviewStatus; label: string; icon: React.ReactNode }[] = [
        { key: "pending", label: "Onay Bekleyen", icon: <Clock className="w-4 h-4" /> },
        { key: "approved", label: "Onaylanan", icon: <CheckCircle2 className="w-4 h-4" /> },
        { key: "all", label: "Tümü", icon: <Filter className="w-4 h-4" /> },
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Yorum Yönetimi</h1>
                <p className="text-gray-500 mt-1">
                    Müşteri yorumlarını onaylayın veya silin.
                    {pendingCount > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                            <AlertCircle className="w-4 h-4" />
                            {pendingCount} yorum onay bekliyor
                        </span>
                    )}
                </p>
            </div>

            <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            statusFilter === tab.key
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.key === "pending" && pendingCount > 0 && (
                            <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                                {pendingCount}
                            </Badge>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Yorum bulunamadı</p>
                    <p className="text-sm mt-1">
                        {statusFilter === "pending"
                            ? "Onay bekleyen yorum yok"
                            : "Bu filtreye uygun yorum yok"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-md ${
                                !review.isApproved ? "border-amber-200 bg-amber-50/30" : "border-gray-200"
                            }`}
                        >
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    {review.product.image ? (
                                        <Image
                                            src={review.product.image}
                                            alt={review.product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {review.product.name}
                                        </h3>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {review.isApproved ? (
                                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Onaylı
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Onay Bekliyor
                                                </Badge>
                                            )}
                                            {review.hasImages && (
                                                <Badge variant="outline" className="border-blue-200 text-blue-700">
                                                    <ImageIcon className="w-3 h-3 mr-1" />
                                                    Fotoğraflı
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-medium text-gray-700">
                                            {review.userName || "Anonim"}
                                        </span>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${
                                                        star <= review.rating
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "text-gray-300"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(review.createdAt)}
                                        </span>
                                    </div>

                                    {review.comment && (
                                        <p className="text-sm text-gray-600 mb-3">{review.comment}</p>
                                    )}

                                    {review.images && review.images.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mb-3">
                                            {review.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => openImagePreview(review.images, idx)}
                                                    className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors group"
                                                >
                                                    <Image
                                                        src={img}
                                                        alt={`Yorum fotoğrafı ${idx + 1}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                        <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {!review.isApproved && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(review.id)}
                                                disabled={actionLoading === review.id}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {actionLoading === review.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                                ) : (
                                                    <Check className="w-4 h-4 mr-1" />
                                                )}
                                                Onayla
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(review.id)}
                                            disabled={actionLoading === review.id}
                                        >
                                            {actionLoading === review.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 mr-1" />
                                            )}
                                            Sil
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={!!previewImages} onOpenChange={() => setPreviewImages(null)}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle>Yorum Fotoğrafları</DialogTitle>
                    </DialogHeader>
                    {previewImages && (
                        <div className="p-4">
                            <div className="relative w-full aspect-square max-h-[70vh] rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                    src={previewImages[previewIndex]}
                                    alt="Yorum fotoğrafı"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            {previewImages.length > 1 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    {previewImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setPreviewIndex(idx)}
                                            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                                                idx === previewIndex
                                                    ? "border-black"
                                                    : "border-gray-200 hover:border-gray-400"
                                            }`}
                                        >
                                            <Image
                                                src={img}
                                                alt={`Küçük resim ${idx + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
