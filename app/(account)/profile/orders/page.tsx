"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ArrowRight,
  MessageSquarePlus,
  FileDown,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import ProductReviewModal from "@/components/product/ProductReviewModal";
import ReturnRequestModal from "@/components/returns/ReturnRequestModal";
import { toast } from "sonner";



type ProductOrder = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "SUCCEEDED";
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    colorName: string | null;
    sizeName: string | null;
    quantity: number;
    image: string | null;
    product: {
      id: string;
      name: string;
      image: string | null;
      slug: string | null;
    };
  }>;
  trackingNumber: string | null;
  shippingAddress: {
    fullAddress: string;
    district: {
      name: string;
    };
  } | null;
};

export default function OrdersPage() {
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const router = useRouter();

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState<{
    id: string;
    name: string;
    image: string | null;
  } | null>(null);

  // Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<ProductOrder | null>(null);

  const handleOpenReturnModal = (order: ProductOrder) => {
    setSelectedReturnOrder(order);
    setReturnModalOpen(true);
  };

  useEffect(() => {
    // Ürün siparişlerini yükle
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setProductOrders(data))
      .finally(() => setLoadingOrders(false));
  }, []);

  const handleOpenReviewModal = (product: { id: string; name: string; image: string | null }) => {
    setSelectedReviewProduct(product);
    setReviewModalOpen(true);
  };

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`);

      if (!response.ok) {
        throw new Error("Fatura oluşturulamadı");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fatura-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Invoice download error:", error);
      toast.error("Fatura indirirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };



  const getOrderStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      PENDING: {
        label: "Beklemede",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="w-3 h-3" />,
      },
      PREPARING: {
        label: "Hazırlanıyor",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Package className="w-3 h-3" />,
      },
      SHIPPED: {
        label: "Kargoya Verildi",
        className: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <Truck className="w-3 h-3" />,
      },
      DELIVERED: {
        label: "Teslim Edildi",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      CANCELLED: {
        label: "İptal Edildi",
        className: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle className="w-3 h-3" />,
      },
    };
    const statusInfo = statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800 border-gray-200",
      icon: null,
    };
    return (
      <Badge className={`${statusInfo.className} border flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full`}>
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Siparişlerim</h1>
        <p className="text-gray-600">Tüm siparişlerinizi buradan görüntüleyebilirsiniz</p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-1 mb-6">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Ürün Siparişleri
            {productOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {productOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Ürün Siparişleri */}
        <TabsContent value="products" className="space-y-4">
          {loadingOrders ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : productOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-600 mb-2">Henüz siparişiniz yok</p>
                <p className="text-sm text-gray-500 text-center mb-6">
                  İlk siparişinizi vermek için ürünlerimizi inceleyebilirsiniz
                </p>
                <Button onClick={() => router.push("/products")}>
                  Ürünleri İncele
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {productOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {order.orderNumber.slice(-3)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">Sipariş No: {order.orderNumber}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(order.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getOrderStatusBadge(order.status)}
                        <div className="text-right">
                          <p className="text-2xl font-bold">{formatPrice(order.total)}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Ürünler */}
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                {item.image || item.product.image ? (
                                  <img
                                    src={item.image || item.product.image || ""}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-base mb-1">{item.productName}</h4>
                                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                  {(item.colorName || item.sizeName) && (
                                    <>
                                      {item.colorName && (
                                        <span className="px-2 py-1 bg-white rounded border border-gray-200">
                                          Renk: {item.colorName}
                                        </span>
                                      )}
                                      {item.sizeName && (
                                        <span className="px-2 py-1 bg-white rounded border border-gray-200">
                                          Beden: {item.sizeName}
                                        </span>
                                      )}
                                    </>
                                  )}
                                  <span className="px-2 py-1 bg-white rounded border border-gray-200">
                                    Adet: {item.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              {item.product.slug && (
                                <Link
                                  href={`/product/${item.product.slug}`}
                                  className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                                  title="Ürünü Görüntüle"
                                >
                                  <Eye className="w-5 h-5" />
                                </Link>
                              )}

                              {/* Sipariş teslim edildiyse yorum yap butonu göster */}
                              {order.status === "DELIVERED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2 text-xs"
                                  onClick={() => handleOpenReviewModal({
                                    id: item.product.id,
                                    name: item.product.name,
                                    image: item.image || item.product.image || null
                                  })}
                                >
                                  <MessageSquarePlus className="w-3 h-3" />
                                  Yorum Yap
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Kargo Bilgisi */}
                      {order.trackingNumber && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <Truck className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">Kargo Takip Numarası</p>
                            <p className="text-sm text-blue-700">{order.trackingNumber}</p>
                          </div>
                        </div>
                      )}

                      {/* Teslimat Adresi */}
                      {order.shippingAddress && (
                        <div className="text-sm text-gray-600">
                          <p className="font-medium mb-1">Teslimat Adresi:</p>
                          <p>
                            {order.shippingAddress.district.name} - {order.shippingAddress.fullAddress}
                          </p>
                        </div>
                      )}

                      {/* Detay ve Fatura Butonları */}
                      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
                        {/* İade Talep Et - Sadece teslim edilmiş siparişler için */}
                        {order.status === "DELIVERED" && (
                          <Button
                            variant="outline"
                            onClick={() => handleOpenReturnModal(order)}
                            className="flex items-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            İade Talep Et
                          </Button>
                        )}

                        {/* Fatura İndir - Sadece ödeme yapılmış siparişler için */}
                        {(order.paymentStatus === "PAID" || order.paymentStatus === "SUCCEEDED") && (
                          <Button
                            variant="outline"
                            onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                            className="flex items-center gap-2"
                          >
                            <FileDown className="w-4 h-4" />
                            Fatura İndir
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => router.push(`/profile/orders/product/${order.id}`)}
                          className="flex items-center gap-2"
                        >
                          Detayları Görüntüle
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Review Modal */}
      {selectedReviewProduct && (
        <ProductReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          productId={selectedReviewProduct.id}
          productName={selectedReviewProduct.name}
          productImage={selectedReviewProduct.image}
          onReviewSubmitted={() => {
            // İsteğe bağlı: Başarılı işlem sonrası bir şeyler yap
          }}
        />
      )}

      {/* Return Request Modal */}
      <ReturnRequestModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        order={selectedReturnOrder}
        onSuccess={() => {
          // Refresh orders after successful return request
          fetch("/api/orders")
            .then((res) => res.json())
            .then((data) => setProductOrders(data));
        }}
      />
    </div>
  );
}
