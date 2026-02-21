"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Printer,
  MoreVertical,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Mail,
  Phone,
  Download,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type Order = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: string | null;
  paymentId: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  trackingNumber: string | null;
  customerNote: string | null;
  adminNote: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
  };
  items: Array<{
    id: string;
    productName: string;
    colorName: string | null;
    sizeName: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    image: string | null;
    product: {
      id: string;
      name: string;
      slug: string | null;
      image: string | null;
    };
  }>;
  shippingAddress: {
    fullAddress: string;
    district: {
      name: string;
    };
  } | null;
  coupon: {
    code: string;
    discountType: string;
    value: number;
  } | null;
  riskScore?: number;
};

type AuditLog = {
  id: string;
  action: string;
  oldValue: any;
  newValue: any;
  performedBy: {
    name: string;
    email: string;
  } | null;
  createdAt: string;
};

type OrderHistory = {
  status: string;
  createdAt: string;
  note?: string;
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
          setAuditLogs(data.auditLogs || []);
          setNewStatus(data.order.status);
        } else {
          // Eğer API direkt order döndürüyorsa (eski format)
          setOrder(data);
          setNewStatus(data.status);
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Sipariş yüklenirken bir hata oluştu");
      }
    } catch (error: any) {
      console.error("Error fetching order:", error);
      toast.error("Sipariş yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber || undefined,
          adminNote: statusNote || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Sipariş durumu güncellendi");
        setStatusModalOpen(false);
        fetchOrder();
      } else {
        throw new Error("Güncelleme başarısız");
      }
    } catch (error) {
      toast.error("Sipariş durumu güncellenirken bir hata oluştu");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Yeni", className: "bg-blue-100 text-blue-800" },
      PREPARING: { label: "Hazırlanıyor", className: "bg-yellow-100 text-yellow-800" },
      SHIPPED: { label: "Kargoya Verildi", className: "bg-purple-100 text-purple-800" },
      DELIVERED: { label: "Teslim Edildi", className: "bg-green-100 text-green-800" },
      CANCELLED: { label: "İptal Edildi", className: "bg-red-100 text-red-800" },
    };
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={`${statusInfo.className} px-3 py-1.5 rounded-full`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Ödeme Bekleniyor", className: "bg-gray-100 text-gray-800" },
      PAID: { label: "Ödendi", className: "bg-green-100 text-green-800" },
      FAILED: { label: "Başarısız", className: "bg-red-100 text-red-800" },
      REFUNDED: { label: "İade Edildi", className: "bg-orange-100 text-orange-800" },
    };
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={`${statusInfo.className} px-3 py-1.5 rounded-full`}>
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

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Sipariş bulunamadı</p>
        <Button onClick={() => router.back()}>Geri Dön</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sipariş #{order.orderNumber}</h1>
            <p className="text-sm text-gray-600">
              {format(new Date(order.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={() => setStatusModalOpen(true)}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            Durum Güncelle
          </Button>
          <Button variant="outline" onClick={() => router.push(`/admin-support/new?orderId=${order.id}`)}>
            <Mail className="w-4 h-4 mr-2" />
            Mesaj
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">İşlemler <MoreVertical className="w-4 h-4 ml-2" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" /> Yazdır
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin-orders/${order.id}/refund`)}>
                <RotateCcw className="w-4 h-4 mr-2" /> İade Oluştur
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Analizi */}
          {order.riskScore !== undefined && order.riskScore > 50 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <CardTitle className="text-red-700">Risk Analizi</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg text-red-900">Skor: {order.riskScore} / 100</p>
                    <p className="text-sm text-red-600">Yüksek riskli sipariş. Lütfen kontrol ediniz.</p>
                  </div>
                  <Button variant="destructive" size="sm">Detaylı İncele</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sipariş ve Ödeme Durumu */}
          <Card>
            <CardHeader>
              <CardTitle>Sipariş ve Ödeme Durumu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Sipariş Durumu</Label>
                <div className="mt-2">{getStatusBadge(order.status)}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Ödeme Durumu</Label>
                <div className="mt-2">{getPaymentStatusBadge(order.paymentStatus)}</div>
              </div>
              {order.paymentMethod && (
                <div>
                  <Label className="text-sm text-gray-600">Ödeme Yöntemi</Label>
                  <p className="mt-2 font-medium">{order.paymentMethod}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ürünler */}
          <Card>
            <CardHeader>
              <CardTitle>Ürünler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
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
                      <h4 className="font-semibold mb-1">{item.productName}</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {item.colorName && <p>Renk: {item.colorName}</p>}
                        {item.sizeName && <p>Beden: {item.sizeName}</p>}
                        <p>Adet: {item.quantity}</p>
                        <p className="font-medium text-gray-900">
                          Birim Fiyat: {formatPrice(item.unitPrice)}
                        </p>
                        <p className="font-semibold text-lg">
                          Toplam: {formatPrice(item.totalPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Durum Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Durum Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Created */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Sipariş Oluşturuldu</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(order.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                    </p>
                  </div>
                </div>

                {/* Paid */}
                {order.paymentStatus === "PAID" && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Ödeme Alındı</p>
                      <p className="text-sm text-gray-600">
                        {order.paidAt
                          ? format(new Date(order.paidAt), "dd MMMM yyyy HH:mm", { locale: tr })
                          : format(new Date(order.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Preparing */}
                {(order.status === "PREPARING" || order.status === "SHIPPED" || order.status === "DELIVERED") && (
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${order.status === "PREPARING" ? "bg-blue-100" : "bg-green-100"
                      }`}>
                      <Package className={`w-4 h-4 ${order.status === "PREPARING" ? "text-blue-600" : "text-green-600"
                        }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Hazırlanıyor</p>
                      {order.status !== "PREPARING" && (
                        <p className="text-sm text-gray-600">Tamamlandı</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipped */}
                {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Kargoya Verildi</p>
                      {order.shippedAt && (
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.shippedAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                        </p>
                      )}
                      {order.trackingNumber && (
                        <p className="text-sm font-mono text-gray-700 mt-1">{order.trackingNumber}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivered */}
                {order.status === "DELIVERED" && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Teslim Edildi</p>
                      {order.deliveredAt && (
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.deliveredAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Cancelled */}
                {order.status === "CANCELLED" && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">İptal Edildi</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notlar */}
          <Card>
            <CardHeader>
              <CardTitle>Notlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.customerNote && (
                <div>
                  <Label className="text-sm text-gray-600">Müşteri Notu</Label>
                  <p className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">{order.customerNote}</p>
                </div>
              )}
              {order.adminNote && (
                <div>
                  <Label className="text-sm text-gray-600">İç Not (Admin)</Label>
                  <p className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">{order.adminNote}</p>
                </div>
              )}
              {!order.customerNote && !order.adminNote && (
                <p className="text-sm text-gray-500">Henüz not eklenmemiş</p>
              )}
            </CardContent>
          </Card>

          {/* İşlem Geçmişi (Audit Logs) */}
          <Card>
            <CardHeader>
              <CardTitle>İşlem Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-gray-500">Henüz kaydedilmiş işlem yok.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-900">
                            {log.action === "UPDATE" ? "Güncelleme" : log.action}
                            {log.performedBy && <span className="text-gray-500 font-normal"> • {log.performedBy.name}</span>}
                          </p>
                          <span className="text-xs text-gray-400">
                            {format(new Date(log.createdAt), "dd MMM HH:mm", { locale: tr })}
                          </span>
                        </div>
                        <div className="mt-1">
                          {/* Basic diff display */}
                          {log.action === "UPDATE" && log.newValue && typeof log.newValue === 'object' && (
                            <div className="text-xs text-gray-600 space-y-1">
                              {(log.newValue as any).status && (
                                <p>Durum: <span className="font-medium">{(log.newValue as any).status}</span></p>
                              )}
                              {(log.newValue as any).paymentStatus && (
                                <p>Ödeme: <span className="font-medium">{(log.newValue as any).paymentStatus}</span></p>
                              )}
                              {(log.newValue as any).trackingNumber && (
                                <p>Kargo Takip: <span className="font-medium">{(log.newValue as any).trackingNumber}</span></p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Kolon */}
        <div className="space-y-6">
          {/* Sipariş Özeti */}
          <Card>
            <CardHeader>
              <CardTitle>Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Ara Toplam</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>İndirim</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Kargo</span>
                <span className={order.shippingCost === 0 ? "text-green-600" : ""}>
                  {order.shippingCost === 0 ? "Ücretsiz" : formatPrice(order.shippingCost)}
                </span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between">
                  <span className="font-bold text-lg">Toplam</span>
                  <span className="font-bold text-lg">{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Müşteri */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Müşteri</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/users?userId=${order.user.id}`)}
                >
                  Geçmiş Siparişler
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={order.user.image || ""} />
                  <AvatarFallback>
                    {order.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{order.user.name}</p>
                  <p className="text-sm text-gray-600">Müşteri Detayları</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{order.user.email}</span>
                </div>
                {order.user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{order.user.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Teslimat Adresi */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Teslimat Adresi</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${order.shippingAddress?.district.name} - ${order.shippingAddress?.fullAddress}`
                      );
                      toast.success("Adres kopyalandı");
                    }}
                  >
                    Kopyala
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{order.user.name}</p>
                  {order.user.phone && <p className="text-sm">{order.user.phone}</p>}
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.district.name} - {order.shippingAddress.fullAddress}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kargo Bilgileri */}
          {(order.status === "SHIPPED" || order.status === "DELIVERED") && order.trackingNumber && (
            <Card>
              <CardHeader>
                <CardTitle>Kargo Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">Kargo Firması</Label>
                  <p className="mt-2 font-medium">MNG Kargo</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Takip Numarası</Label>
                  <p className="mt-2 font-mono font-medium">{order.trackingNumber}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Kargo Etiketi
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Takip Et
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ödeme Detayları */}
          {order.paymentStatus === "PAID" && (
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Detayları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.paymentMethod && (
                  <div>
                    <Label className="text-sm text-gray-600">Ödeme Yöntemi</Label>
                    <p className="mt-1 font-medium">{order.paymentMethod}</p>
                  </div>
                )}
                {order.paymentId && (
                  <div>
                    <Label className="text-sm text-gray-600">Transaction ID</Label>
                    <p className="mt-1 font-mono text-sm">{order.paymentId}</p>
                  </div>
                )}
                {order.paidAt && (
                  <div>
                    <Label className="text-sm text-gray-600">Ödeme Tarihi</Label>
                    <p className="mt-1 text-sm">
                      {format(new Date(order.paidAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Durum Güncelle Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Durum Güncelle</DialogTitle>
            <DialogDescription>Sipariş #{order.orderNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Yeni Durum</Label>
              <div className="mt-2 space-y-2">
                {[
                  { value: "PENDING", label: "Yeni", icon: Package },
                  { value: "PREPARING", label: "Hazırlanıyor", icon: Clock },
                  { value: "PREPARING", label: "Kargoya Hazır", icon: CheckCircle },
                  { value: "SHIPPED", label: "Kargoya Verildi", icon: Truck },
                  { value: "DELIVERED", label: "Teslim Edildi", icon: CheckCircle },
                  { value: "CANCELLED", label: "İptal Edildi", icon: XCircle },
                ].map((status) => {
                  const Icon = status.icon;
                  return (
                    <Button
                      key={status.label}
                      variant={newStatus === status.value ? "default" : "outline"}
                      className={`w-full justify-start h-auto p-3 ${newStatus === status.value ? "bg-gray-900 text-white" : ""
                        }`}
                      onClick={() => setNewStatus(status.value)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {status.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            {newStatus === "SHIPPED" && (
              <div>
                <Label htmlFor="tracking">
                  Kargo Takip Numarası <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tracking"
                  placeholder="Örn: MNG123456789TR"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}
            <div>
              <Label htmlFor="note">Not (Opsiyonel)</Label>
              <Textarea
                id="note"
                placeholder="Durum değişikliği hakkında not ekleyin..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="mt-2 min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{statusNote.length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updating || (newStatus === "SHIPPED" && !trackingNumber)}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
