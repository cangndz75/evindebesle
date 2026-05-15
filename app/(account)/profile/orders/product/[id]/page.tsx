"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    ArrowLeft,
    Package,
    Truck,
    MapPin,
    CreditCard,
    Download,
    RotateCcw,
    CheckCircle,
    Clock,
    XCircle,
    ChevronRight,
    ShoppingBag,
    MessageSquarePlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import ProductReviewModal from "@/components/product/ProductReviewModal";
import MyReviewModal from "@/components/product/MyReviewModal";
import ReturnRequestModal from "@/components/returns/ReturnRequestModal";
import ReturnRequestViewModal from "@/components/returns/ReturnRequestViewModal";

interface OrderDetail {
    id: string;
    orderNumber: string;
    status: "PENDING" | "PREPARING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED";
    paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "SUCCEEDED";
    total: number;
    subtotal: number; // Assuming API returns this or we calculate
    shippingCost: number; // Assuming API returns this
    createdAt: string;
    items: Array<{
        id: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        image: string | null;
        colorName: string | null;
        sizeName: string | null;
        product: {
            id: string;
            name: string;
            slug: string | null;
            image: string | null;
        };
        color: { name: string } | null;
        size: { name: string } | null;
    }>;
    shippingAddress: {
        fullAddress: string;
        district: {
            name: string;
            city: string;
        };
        contactName: string; // Assuming stored in address or user
        contactPhone: string;
    } | null;
    trackingNumber: string | null;
    cargoCompany: {
        id: number;
        name: string;
        code: string;
        trackingUrl: string | null;
    } | null;
    user: {
        fullAddress: string | null;
        district: {
            name: string;
            city: string;
        } | null;
    };
    paymentMethod: string | null; // e.g. "CREDIT_CARD", "IY ZICO"
}

type UserProductReview = {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
};

type ReturnRequestData = {
    id: string;
    orderId: string;
    status: string;
    reason: string;
    description: string | null;
    createdAt: string;
    order: {
        orderNumber: string;
    };
    items: Array<{
        id: string;
        quantity: number;
        reason: string | null;
        orderItem: {
            productName: string;
            colorName: string | null;
            sizeName: string | null;
        };
    }>;
};

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewViewModalOpen, setReviewViewModalOpen] = useState(false);
    const [selectedReviewProduct, setSelectedReviewProduct] = useState<{
        id: string;
        name: string;
        image: string | null;
    } | null>(null);
    const [selectedReviewForView, setSelectedReviewForView] = useState<{
        product: { id: string; name: string; image: string | null };
        review: UserProductReview;
    } | null>(null);
    const [userReviewsByProduct, setUserReviewsByProduct] = useState<Record<string, UserProductReview>>({});

    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnViewModalOpen, setReturnViewModalOpen] = useState(false);
    const [currentReturnRequest, setCurrentReturnRequest] = useState<ReturnRequestData | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data);
                } else {
                    toast.error("Sipariş bulunamadı");
                    router.push("/profile/orders");
                }
            } catch (error) {
                console.error("Error fetching order:", error);
                toast.error("Bir hata oluştu");
                router.push("/profile/orders");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchOrder();
        }
    }, [params.id, router]);

    useEffect(() => {
        if (!order?.items?.length) return;

        const productIds = Array.from(new Set(order.items.map((item) => item.product.id).filter(Boolean)));

        Promise.all(
            productIds.map(async (productId) => {
                const res = await fetch(`/api/product-reviews?productId=${productId}&checkUser=true`);
                const data = await res.json();
                return { productId, review: data?.review || null };
            })
        )
            .then((rows) => {
                const map: Record<string, UserProductReview> = {};
                for (const row of rows) {
                    if (row.review?.id) {
                        map[row.productId] = {
                            id: row.review.id,
                            rating: row.review.rating,
                            comment: row.review.comment ?? null,
                            createdAt: row.review.createdAt,
                        };
                    }
                }
                setUserReviewsByProduct(map);
            })
            .catch(() => setUserReviewsByProduct({}));

        fetch("/api/returns")
            .then((res) => res.json())
            .then((data: ReturnRequestData[]) => {
                const request = (data || []).find((r) => r.orderId === order.id) || null;
                setCurrentReturnRequest(request);
            })
            .catch(() => setCurrentReturnRequest(null));
    }, [order]);

    const handleOpenReviewModal = (product: { id: string; name: string; image: string | null }) => {
        setSelectedReviewProduct(product);
        setReviewModalOpen(true);
    };

    const handleOpenReviewViewModal = (product: { id: string; name: string; image: string | null }, review: UserProductReview) => {
        setSelectedReviewForView({ product, review });
        setReviewViewModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string; icon: any }> = {
            PENDING: { label: "Beklemede", className: "bg-yellow-100 text-yellow-800", icon: Clock },
            PENDING_PAYMENT: { label: "Ödeme Bekleniyor", className: "bg-amber-100 text-amber-800", icon: Clock },
            PAID: { label: "Ödeme Alındı", className: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
            PAYMENT_FAILED: { label: "Ödeme Başarısız", className: "bg-red-100 text-red-800", icon: XCircle },
            PREPARING: { label: "Hazırlanıyor", className: "bg-blue-100 text-blue-800", icon: Package },
            PROCESSING: { label: "Hazırlanıyor", className: "bg-blue-100 text-blue-800", icon: Package },
            SHIPPED: { label: "Kargoya Verildi", className: "bg-purple-100 text-purple-800", icon: Truck },
            DELIVERED: { label: "Teslim Edildi", className: "bg-green-100 text-green-800", icon: CheckCircle },
            COMPLETED: { label: "Tamamlandı", className: "bg-green-100 text-green-800", icon: CheckCircle },
            CANCELLED: { label: "İptal Edildi", className: "bg-red-100 text-red-800", icon: XCircle },
        };
        const info = statusMap[status] || { label: status, className: "bg-gray-100", icon: Clock };
        const Icon = info.icon;
        return (
            <Badge variant="outline" className={`${info.className} border-0 px-3 py-1 text-sm flex items-center gap-2`}>
                <Icon className="w-4 h-4" />
                {info.label}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="w-48 h-8" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="w-full h-64 rounded-xl" />
                        <Skeleton className="w-full h-32 rounded-xl" />
                    </div>
                    <div>
                        <Skeleton className="w-full h-80 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!order) return null;

    const cargoTrackingHref =
        order.trackingNumber && order.cargoCompany?.trackingUrl
            ? order.cargoCompany.trackingUrl.includes("{trackingNumber}")
                ? order.cargoCompany.trackingUrl.replace(
                      "{trackingNumber}",
                      encodeURIComponent(order.trackingNumber)
                  )
                : order.cargoCompany.trackingUrl
            : null;

    return (
        <div className="max-w-5xl mx-auto p-4 md:py-10 md:px-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            Sipariş #{order.orderNumber}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {format(new Date(order.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    {(order.paymentStatus === "PAID" || order.paymentStatus === "SUCCEEDED") && (
                        <Link href={`/profile/orders/product/${order.id}/invoice`}>
                            <Button variant="outline">
                                Fatura Görüntüle
                                <Download className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-6">

                    
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-gray-500" />
                                Sipariş İçeriği ({order.items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {order.items.map((item) => (
                                    <div key={item.id} className="p-4 md:p-6 flex gap-4 md:gap-6 group hover:bg-gray-50 transition-colors">
                                        
                                        <div className="w-20 h-24 md:w-24 md:h-32 bg-gray-100 rounded-lg shrink-0 overflow-hidden border">
                                            {(item.image || item.product.image) ? (
                                                <img
                                                    src={item.image || item.product.image || ""}
                                                    alt={item.productName}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Package className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>

                                        
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className="font-medium text-base md:text-lg text-gray-900 line-clamp-2">
                                                        {item.productName}
                                                    </h3>
                                                    <p className="font-bold text-gray-900 whitespace-nowrap">
                                                        {item.totalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                                    </p>
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {(item.color?.name || item.colorName) && (
                                                        <Badge variant="secondary" className="font-normal text-gray-600 bg-gray-100">
                                                            Renk: {item.color?.name || item.colorName}
                                                        </Badge>
                                                    )}
                                                    {(item.size?.name || item.sizeName) && (
                                                        <Badge variant="secondary" className="font-normal text-gray-600 bg-gray-100">
                                                            Beden: {item.size?.name || item.sizeName}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="secondary" className="font-normal text-gray-600 bg-gray-100">
                                                        Adet: {item.quantity}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {item.product.slug && (
                                                        <Link
                                                            href={`/products/${item.product.slug}`}
                                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                                        >
                                                            Ürüne Git <ChevronRight className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                </div>

                                                
                                                {(order.status === "DELIVERED" || order.status === "COMPLETED") && (
                                                    userReviewsByProduct[item.product.id] ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-2 text-xs"
                                                            onClick={() => handleOpenReviewViewModal(
                                                                {
                                                                    id: item.product.id,
                                                                    name: item.productName,
                                                                    image: item.image || item.product.image,
                                                                },
                                                                userReviewsByProduct[item.product.id]
                                                            )}
                                                        >
                                                            <MessageSquarePlus className="w-3 h-3" />
                                                            Yorumumu Gör
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-2 text-xs"
                                                            onClick={() => handleOpenReviewModal({
                                                                id: item.product.id,
                                                                name: item.productName,
                                                                image: item.image || item.product.image
                                                            })}
                                                        >
                                                            <MessageSquarePlus className="w-3 h-3" />
                                                            Yorum Yap
                                                        </Button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                                    <MapPin className="w-4 h-4" /> Teslimat Adresi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {order.shippingAddress ? (
                                    <div className="text-sm text-gray-600 space-y-1 min-w-0">
                                        <p className="wrap-break-word whitespace-pre-wrap">{order.shippingAddress.fullAddress}</p>
                                        <p className="wrap-break-word">{order.shippingAddress.district?.name} / {order.shippingAddress.district?.city}</p>
                                    </div>
                                ) : order.user?.fullAddress ? (
                                    <div className="text-sm text-gray-600 space-y-1 min-w-0">
                                        <p className="wrap-break-word whitespace-pre-wrap">{order.user.fullAddress}</p>
                                        {order.user.district && (
                                            <p className="wrap-break-word">{order.user.district.name} / {order.user.district.city}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Adres bilgisi bulunamadı.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                                    <Truck className="w-4 h-4" /> Kargo Bilgileri
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Kargo Firması</p>
                                        <p className="font-medium">
                                            {order.cargoCompany?.name || "Henüz atanmadı"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Takip Numarası</p>
                                        {order.trackingNumber ? (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {cargoTrackingHref ? (
                                                    <a
                                                        href={cargoTrackingHref}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-mono text-sm bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 underline-offset-2 hover:underline"
                                                    >
                                                        {order.trackingNumber}
                                                    </a>
                                                ) : (
                                                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                                        {order.trackingNumber}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">Henüz oluşmadı</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>

                
                <div className="space-y-6">
                    <Card className="border-none shadow-sm sticky top-24">
                        <CardHeader className="bg-gray-50/50 border-b pb-4">
                            <CardTitle className="text-lg">Sipariş Özeti</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Ara Toplam</span>
                                <span>{order.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Kargo</span>
                                {order.shippingCost > 0 ? (
                                    <span>{order.shippingCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                ) : (
                                    <span className="text-green-600 font-medium">Ücretsiz</span>
                                )}
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg">Toplam</span>
                                <span className="font-bold text-xl text-primary">
                                    {order.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                </span>
                            </div>

                            <div className="pt-4 space-y-3">
                                <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-blue-700 font-medium uppercase">Ödeme Yöntemi</p>
                                        <p className="text-sm text-blue-900 font-bold">Kredi Kartı (Iyzico)</p>
                                    </div>
                                </div>

                                {(order.status === "DELIVERED" || order.status === "COMPLETED") && (
                                    currentReturnRequest ? (
                                        <Button
                                            variant="outline"
                                            className="w-full flex items-center gap-2"
                                            onClick={() => setReturnViewModalOpen(true)}
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            İadeyi Görüntüle
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="w-full flex items-center gap-2"
                                            onClick={() => setReturnModalOpen(true)}
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            İade Oluştur
                                        </Button>
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            
            {selectedReviewProduct && (
                <ProductReviewModal
                    isOpen={reviewModalOpen}
                    onClose={() => setReviewModalOpen(false)}
                    productId={selectedReviewProduct.id}
                    productName={selectedReviewProduct.name}
                    productImage={selectedReviewProduct.image}
                    onReviewSubmitted={() => {
                        fetch(`/api/product-reviews?productId=${selectedReviewProduct.id}&checkUser=true`)
                            .then((res) => res.json())
                            .then((data) => {
                                if (data?.review?.id) {
                                    setUserReviewsByProduct((prev) => ({
                                        ...prev,
                                        [selectedReviewProduct.id]: {
                                            id: data.review.id,
                                            rating: data.review.rating,
                                            comment: data.review.comment ?? null,
                                            createdAt: data.review.createdAt,
                                        },
                                    }));
                                }
                            });
                    }}
                />
            )}

            {selectedReviewForView && (
                <MyReviewModal
                    isOpen={reviewViewModalOpen}
                    onClose={() => setReviewViewModalOpen(false)}
                    productId={selectedReviewForView.product.id}
                    productName={selectedReviewForView.product.name}
                    productImage={selectedReviewForView.product.image}
                    review={selectedReviewForView.review}
                    onDeleted={() => {
                        setUserReviewsByProduct((prev) => {
                            const next = { ...prev };
                            delete next[selectedReviewForView.product.id];
                            return next;
                        });
                    }}
                />
            )}

            <ReturnRequestModal
                isOpen={returnModalOpen}
                onClose={() => setReturnModalOpen(false)}
                order={order ? {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    items: order.items.map((item) => ({
                        id: item.id,
                        productName: item.productName,
                        colorName: item.colorName,
                        sizeName: item.sizeName,
                        quantity: item.quantity,
                        image: item.image,
                        product: {
                            id: item.product.id,
                            name: item.product.name,
                            image: item.product.image,
                        },
                    })),
                } : null}
                onSuccess={() => {
                    fetch("/api/returns")
                        .then((res) => res.json())
                        .then((data: ReturnRequestData[]) => {
                            const request = (data || []).find((r) => r.orderId === order.id) || null;
                            setCurrentReturnRequest(request);
                        });
                }}
            />

            <ReturnRequestViewModal
                isOpen={returnViewModalOpen}
                onClose={() => setReturnViewModalOpen(false)}
                data={currentReturnRequest}
                onCancelled={() => {
                    fetch("/api/returns")
                        .then((res) => res.json())
                        .then((data: ReturnRequestData[]) => {
                            const request = (data || []).find((r) => r.orderId === order.id) || null;
                            setCurrentReturnRequest(request);
                        });
                }}
            />
        </div>
    );
}
