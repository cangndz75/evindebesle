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
    ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";

interface OrderDetail {
    id: string;
    orderNumber: string;
    status: "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
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
    paymentMethod: string | null; // e.g. "CREDIT_CARD", "IY ZICO"
}

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

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

    const handleDownloadInvoice = async () => {
        if (!order) return;
        setDownloading(true);
        try {
            const response = await fetch(`/api/orders/${order.id}/invoice`);
            if (!response.ok) throw new Error("Fatura indirilemedi");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `fatura-${order.orderNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Fatura indirildi");
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Fatura indirilemedi");
        } finally {
            setDownloading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string; icon: any }> = {
            PENDING: { label: "Beklemede", className: "bg-yellow-100 text-yellow-800", icon: Clock },
            PREPARING: { label: "Hazırlanıyor", className: "bg-blue-100 text-blue-800", icon: Package },
            SHIPPED: { label: "Kargoya Verildi", className: "bg-purple-100 text-purple-800", icon: Truck },
            DELIVERED: { label: "Teslim Edildi", className: "bg-green-100 text-green-800", icon: CheckCircle },
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

    return (
        <div className="max-w-5xl mx-auto p-4 md:py-10 md:px-6">
            {/* Header */}
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
                        <Button variant="outline" onClick={handleDownloadInvoice} disabled={downloading}>
                            {downloading ? "İndiriliyor..." : "Fatura İndir"}
                            <Download className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Items & Shipping */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Items Card */}
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
                                        {/* Product Image */}
                                        <div className="w-20 h-24 md:w-24 md:h-32 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border">
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

                                        {/* Details */}
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
                                                {item.product.slug && (
                                                    <Link
                                                        href={`/product/${item.product.slug}`}
                                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                                    >
                                                        Ürüne Git <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery & Address Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                                    <MapPin className="w-4 h-4" /> Teslimat Adresi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {order.shippingAddress ? (
                                    <div className="text-sm text-gray-600 space-y-1">
                                        {/* <p className="font-semibold text-gray-900">{order.shippingAddress.contactName}</p> */}
                                        <p>{order.shippingAddress.fullAddress}</p>
                                        <p>{order.shippingAddress.district?.name} / {order.shippingAddress.district?.city}</p>
                                        {/* <p className="mt-2">{order.shippingAddress.contactPhone}</p> */}
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
                                        <p className="font-medium">Aras Kargo</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Takip Numarası</p>
                                        {order.trackingNumber ? (
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                                    {order.trackingNumber}
                                                </p>
                                                {/* <Button variant="link" className="p-0 h-auto text-xs">Sorgula</Button> */}
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

                {/* Right Column: Summary & Actions */}
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

                                {order.status === "DELIVERED" && (
                                    <Button variant="outline" className="w-full flex items-center gap-2">
                                        <RotateCcw className="w-4 h-4" />
                                        İade Oluştur
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
