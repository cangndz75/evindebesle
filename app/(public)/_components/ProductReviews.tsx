"use client";

import { useState, useMemo } from "react";
import { Star, Search, Check, ChevronDown, X, MessageSquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProductReviewModal from "@/components/product/ProductReviewModal";

type Review = {
  id: string;
  reviewerName: string;
  isVerified: boolean;
  rating: number;
  title: string;
  comment: string;
  date: string;
  usualSize: string;
  size: string;
  height: string;
  bodyShape: string;
  weight: number;
  fit: "small" | "true" | "large";
  length: "short" | "true" | "long" | "large";
};

// Tarih formatlama fonksiyonu
function formatDate(date: Date | string): string {
  const now = new Date();
  const reviewDate = new Date(date);
  const diffTime = Math.abs(now.getTime() - reviewDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "BUGÜN";
  if (diffDays === 1) return "1 GÜN ÖNCE";
  if (diffDays < 7) return `${diffDays} GÜN ÖNCE`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} HAFTA ÖNCE`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} AY ÖNCE`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} YIL ÖNCE`;
}

interface ProductReviewsProps {
  productId: string;
  productName?: string;
  productImage?: string | null;
  selectedColorId?: string;
  reviews?: { id: string; userName: string; rating: number; comment: string; createdAt: Date | string; colorId?: string; colorName?: string }[];
  hasOrdered?: boolean; // Kullanıcı bu ürünü sipariş verdi mi?
}

export default function ProductReviews({ productId, productName = "Ürün", productImage = null, selectedColorId, reviews = [], hasOrdered = false }: ProductReviewsProps) {
  const [showAllModal, setShowAllModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("highest");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Seçili renge göre filtrelenmiş yorumlar
  const filteredReviews = useMemo(() => {
    if (selectedColorId) {
      return reviews.filter((r) => r.colorId === selectedColorId || !r.colorId);
    }
    return reviews;
  }, [reviews, selectedColorId]);

  // Calculate average rating (filtrelenmiş yorumlara göre)
  const averageRating = useMemo(() => {
    if (filteredReviews.length === 0) return "0.0";
    const total = filteredReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / filteredReviews.length).toFixed(1);
  }, [filteredReviews]);

  // Filter and sort reviews
  const displayedReviews = useMemo(() => {
    let filtered = filteredReviews.map((r) => ({
      id: r.id,
      reviewerName: r.userName,
      isVerified: false,
      rating: r.rating,
      title: r.comment?.substring(0, 50) || "",
      comment: r.comment || "",
      date: formatDate(r.createdAt),
      usualSize: "",
      size: "",
      height: "",
      bodyShape: "",
      weight: 0,
      fit: "true" as const,
      length: "true" as const,
    }));

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.title.toLowerCase().includes(query) ||
          review.comment.toLowerCase().includes(query) ||
          review.reviewerName.toLowerCase().includes(query)
      );
    }

    // Rating filter
    if (filterRating !== null) {
      filtered = filtered.filter((review) => review.rating === filterRating);
    }

    // Sort
    if (sortBy === "highest") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
      filtered.sort((a, b) => a.rating - b.rating);
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const dateA = parseInt(a.date) || 0; // Basit parse, geliştirilebilir
        const dateB = parseInt(b.date) || 0;
        return dateA - dateB;
      });
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => {
        const dateA = parseInt(a.date) || 0;
        const dateB = parseInt(b.date) || 0;
        return dateB - dateA;
      });
    }

    return filtered;
  }, [filteredReviews, searchQuery, sortBy, filterRating]);

  // Show first 2 reviews on page
  const initialReviews = displayedReviews.slice(0, 2);
  const remainingCount = displayedReviews.length - 2;

  const handleReviewSubmitted = () => {
    // Sayfayı yenilemek en basiti, veya bir callback ile üst componenti güncelleyebiliriz.
    // Şimdilik reload.
    window.location.reload();
  };

  return (
    <>
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-12 border-t border-gray-200">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h2 className="text-3xl md:text-4xl font-serif font-light text-black text-center md:text-left">
            Yorumlar
          </h2>
          {hasOrdered && (
            <Button
              onClick={() => setShowReviewModal(true)}
              className="bg-black text-white hover:bg-gray-800 flex items-center gap-2"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Yorum Yap
            </Button>
          )}
        </div>

        {/* Empty State */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="flex justify-center mb-4">
              <Star className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz yorum yapılmamış</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Bu ürün hakkında ilk yorumu siz yaparak diğer kullanıcılara yardımcı olabilirsiniz.
            </p>
            {hasOrdered && (
              <Button variant="outline" onClick={() => setShowReviewModal(true)}>
                İlk Yorumu Yap
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Overall Rating */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-light text-black">{averageRating}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${star <= Math.round(Number(averageRating))
                        ? "fill-black text-black"
                        : "text-gray-300"
                        }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 font-light">
                {filteredReviews.length} yoruma dayanarak
              </p>
            </div>

            {/* Filtreleme UI - Ana Sayfada */}
            <div className="mb-8 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Yorumlarda ara..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm font-light"
                />
              </div>

              {/* Rating Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 font-light">Filtrele:</span>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                    className={`px-3 py-1 text-sm border transition-colors font-light ${filterRating === rating
                      ? "border-black bg-black text-white"
                      : "border-gray-300 hover:border-black"
                      }`}
                  >
                    {rating} Yıldız
                  </button>
                ))}
              </div>
            </div>

            {/* Initial Reviews */}
            <div className="space-y-8 mb-8">
              {displayedReviews.slice(0, 2).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {/* Load More Button */}
            {displayedReviews.length > 2 && (
              <div className="text-center">
                <button
                  onClick={() => setShowAllModal(true)}
                  className="px-8 py-3 border border-black text-black text-sm font-light uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
                >
                  Daha Fazla Yükle ({displayedReviews.length - 2})
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Reviews Modal - Show All */}
      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <DialogTitle className="text-2xl font-serif font-light text-black">
              Tüm Yorumlar
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-6">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Yorumlarda ara..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
                />
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-light hover:border-black transition-colors">
                  <span>+ Filtre</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-light">Sırala:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm bg-transparent border-none focus:outline-none cursor-pointer font-light"
                  >
                    <option value="highest">En Yüksek Puan</option>
                    <option value="lowest">En Düşük Puan</option>
                    <option value="newest">En Yeni</option>
                    <option value="oldest">En Eski</option>
                  </select>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 font-light">Filtrele:</span>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                    className={`px-3 py-1 text-sm border transition-colors ${filterRating === rating
                      ? "border-black bg-black text-white"
                      : "border-gray-300 hover:border-black"
                      }`}
                  >
                    {rating} Yıldız
                  </button>
                ))}
              </div>
            </div>

            {/* All Reviews */}
            <div className="space-y-8">
              {displayedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Submission Modal */}
      <ProductReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        productId={productId}
        productName={productName}
        productImage={productImage}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border-b border-gray-200 pb-8 last:border-b-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-black">{review.reviewerName}</h3>
            {review.isVerified && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Check className="w-3 h-3" />
                <span>Doğrulanmış Alıcı</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= review.rating ? "fill-black text-black" : "text-gray-300"
                  }`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-gray-600 font-light">{review.date}</span>
      </div>

      {review.title && (
        <h4 className="text-sm font-medium text-black mb-2">{review.title}</h4>
      )}
      <p className="text-sm text-gray-700 font-light mb-4">{review.comment}</p>
    </div>
  );
}
