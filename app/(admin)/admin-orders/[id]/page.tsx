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
  Mail,
  Phone,
  AlertTriangle,
  RotateCcw,
  Copy,
  ExternalLink,
  FileText,
  CreditCard,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type Order = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PAID" | "PREPARING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REFUNDED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "SUCCEEDED";
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
  cargoCompany?: {
    id: number;
    name: string;
    code: string;
  } | null;
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
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [invoice, setInvoice] = useState<{ id: string; invoiceNumber: string; status: string; totalAmount: number; createdAt: string } | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

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
          setInvoice(data.invoice || null);
          setNewStatus(data.order.status);
        } else {
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

  const handleCreateInvoice = async () => {
    if (!order) return;
    setCreatingInvoice(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (res.ok) {
        const inv = await res.json();
        setInvoice(inv);
        toast.success("Fatura başarıyla oluşturuldu");
        router.push(`/admin-invoices/${inv.id}`);
      } else {
        const msg = await res.text();
        toast.error(msg || "Fatura oluşturulamadı");
      }
    } catch {
      toast.error("Fatura oluşturulurken bir hata oluştu");
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleCreateCargoLabel = async () => {
    if (!order) return;

    setCreatingLabel(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/ship-label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cargoCompanyCode: "aras" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Kargo barkodu oluşturulamadı");
      }

      const data = await res.json();
      toast.success(`Kargo barkodu oluşturuldu: ${data.trackingNumber}`);
      await fetchOrder();
    } catch (error: any) {
      toast.error(error?.message || "Kargo barkodu oluşturulamadı");
    } finally {
      setCreatingLabel(false);
    }
  };

  const getOrderStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "Yeni",
      PENDING_PAYMENT: "Ödeme Bekleniyor",
      PAID: "Ödendi",
      PAYMENT_SUCCESS: "Ödeme Alındı",
      PAYMENT_FAILED: "Ödeme Başarısız",
      PAYMENT_CAPTURE_FAILED: "Ödeme Tahsilatı Başarısız",
      PREPARING: "Hazırlanıyor",
      PROCESSING: "Hazırlanıyor",
      SHIPPED: "Kargoya Verildi",
      DELIVERED: "Teslim Edildi",
      COMPLETED: "Tamamlandı",
      CANCELLED: "İptal Edildi",
      REFUNDED: "İade Edildi",
      DRAFT: "Taslak",
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "Ödeme Bekleniyor",
      PENDING_PAYMENT: "Ödeme Bekleniyor",
      PAID: "Ödendi",
      SUCCEEDED: "Ödendi",
      PAYMENT_SUCCESS: "Ödendi",
      FAILED: "Başarısız",
      PAYMENT_FAILED: "Başarısız",
      PAYMENT_CAPTURE_FAILED: "Tahsilat Başarısız",
      REFUNDED: "İade Edildi",
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Yeni", className: "bg-blue-100 text-blue-800" },
      PENDING_PAYMENT: { label: "Ödeme Bekleniyor", className: "bg-amber-100 text-amber-800" },
      PAID: { label: "Ödendi", className: "bg-emerald-100 text-emerald-800" },
      PAYMENT_SUCCESS: { label: "Ödeme Alındı", className: "bg-emerald-100 text-emerald-800" },
      PAYMENT_FAILED: { label: "Ödeme Başarısız", className: "bg-red-100 text-red-800" },
      PAYMENT_CAPTURE_FAILED: { label: "Tahsilat Başarısız", className: "bg-red-100 text-red-800" },
      PREPARING: { label: "Hazırlanıyor", className: "bg-yellow-100 text-yellow-800" },
      PROCESSING: { label: "Hazırlanıyor", className: "bg-yellow-100 text-yellow-800" },
      SHIPPED: { label: "Kargoya Verildi", className: "bg-purple-100 text-purple-800" },
      DELIVERED: { label: "Teslim Edildi", className: "bg-green-100 text-green-800" },
      COMPLETED: { label: "Tamamlandı", className: "bg-green-100 text-green-800" },
      CANCELLED: { label: "İptal Edildi", className: "bg-red-100 text-red-800" },
      REFUNDED: { label: "İade Edildi", className: "bg-orange-100 text-orange-800" },
      DRAFT: { label: "Taslak", className: "bg-gray-100 text-gray-800" },
    };
    const statusInfo = statusMap[status] || { label: getOrderStatusLabel(status), className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={`${statusInfo.className} px-3 py-1.5 rounded-full`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Ödeme Bekleniyor", className: "bg-gray-100 text-gray-800" },
      PENDING_PAYMENT: { label: "Ödeme Bekleniyor", className: "bg-amber-100 text-amber-800" },
      PAID: { label: "Ödendi", className: "bg-green-100 text-green-800" },
      SUCCEEDED: { label: "Ödendi", className: "bg-green-100 text-green-800" },
      PAYMENT_SUCCESS: { label: "Ödendi", className: "bg-green-100 text-green-800" },
      FAILED: { label: "Başarısız", className: "bg-red-100 text-red-800" },
      PAYMENT_FAILED: { label: "Başarısız", className: "bg-red-100 text-red-800" },
      PAYMENT_CAPTURE_FAILED: { label: "Tahsilat Başarısız", className: "bg-red-100 text-red-800" },
      REFUNDED: { label: "İade Edildi", className: "bg-orange-100 text-orange-800" },
    };
    const statusInfo = statusMap[status] || { label: getPaymentStatusLabel(status), className: "bg-gray-100 text-gray-800" };
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

  const getTrackingUrl = () => {
    if (!order?.trackingNumber) return null;
    const code = order.cargoCompany?.code?.toLowerCase();
    if (code === "aras") return `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${order.trackingNumber}`;
    if (code === "yurtici") return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${order.trackingNumber}`;
    if (code === "trendyolexpress") return `https://www.trendyol.com/kargo-takip?trackingNumber=${order.trackingNumber}`;
    return null;
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

  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const trackingUrl = getTrackingUrl();
  const isShipped = ["SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status);
  const isPaid = ["PAID", "SUCCEEDED", "PAYMENT_SUCCESS"].includes(order.paymentStatus);
  const estimatedSaving = Math.max(0, order.discount + (order.shippingCost === 0 ? 0 : 0));
  const orderHistory: OrderHistory[] = [
    { status: "ORDER_CREATED", createdAt: order.createdAt },
    ...(isPaid ? [{ status: "PAYMENT_SUCCESS", createdAt: order.paidAt || order.createdAt }] : []),
    ...(["PREPARING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status)
      ? [{ status: "ORDER_PROCESSING", createdAt: order.paidAt || order.createdAt }]
      : []),
    ...(isShipped
      ? [{ status: "SHIPPED", createdAt: order.shippedAt || order.createdAt }]
      : []),
    ...(["DELIVERED", "COMPLETED"].includes(order.status)
      ? [{ status: "DELIVERED", createdAt: order.deliveredAt || order.shippedAt || order.createdAt }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span>Siparişler</span>
        <span>&gt;</span>
        <span className="font-medium text-slate-700">#{order.orderNumber}</span>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">#{order.orderNumber}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {getPaymentStatusBadge(order.paymentStatus)}
            {getStatusBadge(order.status)}
            <span className="text-sm text-slate-500">
              {format(new Date(order.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {invoice ? (
            <Button variant="outline" onClick={() => router.push(`/admin-invoices/${invoice.id}`)}>
              <FileText className="mr-2 h-4 w-4" />
              Faturayı Görüntüle
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleCreateInvoice}
              disabled={creatingInvoice}
            >
              <FileText className="mr-2 h-4 w-4" />
              {creatingInvoice ? "Oluşturuluyor..." : "Fatura Oluştur"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/admin-orders/${order.id}/print`)}
            disabled={!order.trackingNumber}
            className={order.trackingNumber ? "bg-indigo-600 text-white hover:bg-indigo-700" : "opacity-50 cursor-not-allowed"}
          >
            <Printer className="mr-2 h-4 w-4" />
            Etiketi Yazdır
          </Button>
          <Button variant="outline" onClick={() => setStatusModalOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Durum Güncelle
          </Button>
          {order.status !== "SHIPPED" && order.status !== "DELIVERED" && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
            <Button
              onClick={handleCreateCargoLabel}
              disabled={creatingLabel}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Truck className="mr-2 h-4 w-4" />
              {creatingLabel ? "Barkod Oluşturuluyor" : "Kargo Barkodu Oluştur"}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/admin-support/new?orderId=${order.id}`)}>
                <Mail className="mr-2 h-4 w-4" /> Mesaj
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin-orders/${order.id}/refund`)}>
                <RotateCcw className="mr-2 h-4 w-4" /> İade Oluştur
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(340px,1fr)]">
        <div className="space-y-5">
          {order.riskScore !== undefined && order.riskScore > 50 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <CardTitle className="text-red-700">Risk Analizi</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-red-900">Skor: {order.riskScore} / 100</p>
                    <p className="text-sm text-red-600">Yüksek riskli sipariş. Lütfen kontrol ediniz.</p>
                  </div>
                  <Button variant="destructive" size="sm">Detaylı İncele</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Ürünler</CardTitle>
                <Badge variant="secondary" className="rounded-full px-3">{totalQuantity} adet</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="hidden border-y bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[minmax(0,1.7fr)_1fr_80px_130px_130px]">
                <span>Ürün</span>
                <span>SKU</span>
                <span className="text-center">Adet</span>
                <span className="text-right">Birim Fiyat</span>
                <span className="text-right">Toplam</span>
              </div>
              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.7fr)_1fr_80px_130px_130px] md:items-center md:px-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-14 w-14 overflow-hidden rounded-lg border bg-slate-100">
                        {item.image || item.product.image ? (
                          <img
                            src={item.image || item.product.image || ""}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.productName}</p>
                        <div className="mt-1 flex flex-wrap gap-1 text-xs text-slate-500">
                          {item.colorName && <Badge variant="secondary" className="rounded-md">Renk: {item.colorName}</Badge>}
                          {item.sizeName && <Badge variant="secondary" className="rounded-md">Beden: {item.sizeName}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-slate-500 md:text-sm">{item.product.slug || item.id.slice(0, 12)}</div>
                    <div className="md:text-center">
                      <Badge variant="secondary" className="h-8 min-w-8 justify-center rounded-md">{item.quantity}</Badge>
                    </div>
                    <div className="text-sm font-medium text-slate-700 md:text-right">{formatPrice(item.unitPrice)}</div>
                    <div className="text-sm font-semibold text-slate-900 md:text-right">{formatPrice(item.totalPrice)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Kargo &amp; Teslimat</CardTitle>
                <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-red-500 text-sm font-bold text-white">
                    {(order.cargoCompany?.name || "AK").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{order.cargoCompany?.name || "Aras Kargo"}</p>
                    <p className="text-xs text-slate-500">Kargo Firması</p>
                  </div>
                </div>
                <Badge className="bg-amber-100 text-amber-700">{isShipped ? "Kargoya Verildi" : "Hazırlanıyor"}</Badge>
              </div>

              <div className="space-y-2 rounded-xl border bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Takip Numarası</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold tracking-wide text-slate-900">{order.trackingNumber || "Henüz oluşturulmadı"}</p>
                  {order.trackingNumber && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(order.trackingNumber || "");
                          toast.success("Takip numarası kopyalandı");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {trackingUrl && (
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => window.open(trackingUrl, "_blank") }>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {order.trackingNumber && (
                <div className="rounded-xl border border-dashed bg-white p-5">
                  <div
                    className="mx-auto h-11 w-56"
                    style={{
                      backgroundImage: "repeating-linear-gradient(90deg, #0f172a 0, #0f172a 2px, transparent 2px, transparent 4px)",
                    }}
                  />
                  <p className="mt-2 text-center text-xs font-medium tracking-[0.2em] text-slate-500">{order.trackingNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle>Sipariş Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderHistory.map((history, index) => {
                  const isLast = index === orderHistory.length - 1;
                  const statusMap: Record<string, { label: string; code: string; done: boolean; warning?: boolean }> = {
                    ORDER_CREATED: { label: "Sipariş Oluşturuldu", code: "ORDER_CREATED", done: true },
                    PAYMENT_SUCCESS: { label: "Ödeme Alındı", code: "PAYMENT_SUCCESS", done: isPaid },
                    ORDER_PROCESSING: { label: "Hazırlanıyor", code: "ORDER_PROCESSING", done: ["PREPARING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status), warning: ["PREPARING", "PROCESSING"].includes(order.status) },
                    SHIPPED: { label: "Kargoya Verildi", code: "SHIPPED", done: isShipped },
                    DELIVERED: { label: "Teslim Edildi", code: "DELIVERED", done: ["DELIVERED", "COMPLETED"].includes(order.status) },
                  };
                  const item = statusMap[history.status];
                  return (
                    <div key={`${history.status}-${index}`} className="relative flex items-start gap-3">
                      <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${item.warning ? "bg-amber-100" : item.done ? "bg-emerald-100" : "bg-slate-100"}`}>
                        {item.warning ? (
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                        ) : item.done ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>
                      {!isLast && <div className="absolute left-3 top-7 h-8 w-px bg-slate-200" />}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className={`font-medium ${item.done ? "text-slate-900" : "text-slate-400"}`}>{item.label}</p>
                          <p className="text-xs text-slate-500">{format(new Date(history.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}</p>
                        </div>
                        <Badge variant="secondary" className="mt-1 text-[11px]">{item.code}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {auditLogs.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>İşlem Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-slate-900">
                            {log.action === "UPDATE" ? "Güncelleme" : log.action}
                            {log.performedBy && <span className="font-normal text-slate-500"> • {log.performedBy.name}</span>}
                          </p>
                          <span className="text-xs text-slate-400">{format(new Date(log.createdAt), "dd MMM HH:mm", { locale: tr })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle>Müşteri Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
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
                  <p className="font-semibold text-slate-900">{order.user.name}</p>
                  <p className="text-sm text-slate-500">Kayıtlı Müşteri</p>
                </div>
              </div>

              <div className="space-y-2 border-b pb-4">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{order.user.email}</span>
                </div>
                {order.user.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{order.user.phone}</span>
                  </div>
                )}
              </div>

              {order.shippingAddress && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teslimat Adresi</p>
                  <div className="rounded-xl border bg-slate-50 p-4 text-sm">
                    <p className="font-semibold text-slate-900">{order.user.name}</p>
                    <p className="mt-1 text-slate-600">{order.shippingAddress.fullAddress}</p>
                    <p className="mt-1 text-slate-600">{order.shippingAddress.district.name}</p>
                  </div>
                </div>
              )}

              {order.shippingAddress && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fatura Adresi</p>
                  <div className="rounded-xl border bg-slate-50 p-4 text-sm">
                    <p className="font-semibold text-slate-900">{order.user.name}</p>
                    <p className="mt-1 text-slate-600">{order.shippingAddress.fullAddress}</p>
                    <p className="mt-1 text-slate-600">{order.shippingAddress.district.name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle>Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Ara Toplam</span>
                <span className="font-medium text-slate-900">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-600">
                  <span>İndirim</span>
                  <span className="font-semibold">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Kargo</span>
                <span className={order.shippingCost === 0 ? "font-medium text-emerald-600" : "font-medium text-slate-900"}>
                  {order.shippingCost === 0 ? "Ücretsiz" : formatPrice(order.shippingCost)}
                </span>
              </div>
              <div className="mt-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold text-slate-900">Genel Toplam</span>
                  <span className="text-2xl font-bold text-slate-900">{formatPrice(order.total)}</span>
                </div>
              </div>
              {estimatedSaving > 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  {formatPrice(estimatedSaving)} tasarruf edildi
                </div>
              )}
            </CardContent>
          </Card>

          {(isPaid || order.paymentMethod || order.paymentId) && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle>Ödeme Detayları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.paymentMethod && (
                  <div className="flex items-start gap-3 text-sm">
                    <CreditCard className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">Ödeme Yöntemi</p>
                      <p className="font-semibold text-slate-900">{order.paymentMethod}</p>
                    </div>
                  </div>
                )}
                {order.paymentId && (
                  <div className="flex items-start gap-3 text-sm">
                    <FileText className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">İşlem ID</p>
                      <p className="font-mono font-semibold text-slate-900">#{order.paymentId}</p>
                    </div>
                  </div>
                )}
                {order.paidAt && (
                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">Ödeme Tarihi</p>
                      <p className="font-semibold text-slate-900">{format(new Date(order.paidAt), "dd MMMM yyyy HH:mm", { locale: tr })}</p>
                    </div>
                  </div>
                )}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  Ödeme Doğrulandı
                </div>
              </CardContent>
            </Card>
          )}

          {(order.customerNote || order.adminNote) && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Notlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.customerNote && (
                  <div>
                    <Label className="text-xs text-slate-500">Müşteri Notu</Label>
                    <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{order.customerNote}</p>
                  </div>
                )}
                {order.adminNote && (
                  <div>
                    <Label className="text-xs text-slate-500">İç Not</Label>
                    <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{order.adminNote}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      
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
                  { value: "PROCESSING", label: "Hazırlanıyor", icon: Clock },
                  { value: "SHIPPED", label: "Kargoya Verildi", icon: Truck },
                  { value: "COMPLETED", label: "Tamamlandı", icon: CheckCircle },
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
                className="mt-2 min-h-25"
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
