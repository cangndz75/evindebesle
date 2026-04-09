"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreVertical, Eye, Package, Truck, CheckCircle, XCircle, Search, Bell, Download, Filter, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Order = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PENDING_PAYMENT" | "PAID" | "PREPARING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  trackingNumber: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    productName: string;
    colorName: string | null;
    sizeName: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      id: string;
      name: string;
      image: string | null;
    };
  }>;
  shippingAddress: {
    fullAddress: string;
    district: {
      name: string;
    };
  } | null;
  riskScore?: number;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "PROCESSING" | "SHIPPED" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [orderToShip, setOrderToShip] = useState<string | null>(null);
  const [isBulkTracking, setIsBulkTracking] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Siparişler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, activeTab]);

  const handleStatusChange = async (orderId: string, newStatus: string, trackingNumber?: string) => {
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...(trackingNumber && { trackingNumber }),
        }),
      });

      if (res.ok) {
        toast.success("Sipariş durumu güncellendi");
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          const updated = await res.json();
          setSelectedOrder(updated.order);
        }
      } else {
        throw new Error("Güncelleme başarısız");
      }
    } catch (error) {
      toast.error("Sipariş durumu güncellenirken bir hata oluştu");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateInvoice = async (orderId: string) => {
    try {
      setUpdatingStatus(true);
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        const invoice = await res.json();
        toast.success("Fatura başarıyla oluşturuldu");
        router.push(`/admin-invoices/${invoice.id}`);
      } else {
        const msg = await res.text();
        toast.error(msg || "Fatura oluşturulamadı");
      }
    } catch (error) {
      toast.error("Bir hata oluştu");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getOrderStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "Beklemede",
      PENDING_PAYMENT: "Ödeme Bekleniyor",
      PAID: "Ödendi",
      PROCESSING: "Hazırlanıyor",
      PAYMENT_SUCCESS: "Ödeme Alındı",
      PAYMENT_FAILED: "Ödeme Başarısız",
      PAYMENT_CAPTURE_FAILED: "Ödeme Tahsilatı Başarısız",
      PREPARING: "Hazırlanıyor",
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
      PENDING: { label: "Beklemede", className: "bg-yellow-100 text-yellow-800" },
      PENDING_PAYMENT: { label: "Ödeme Bekleniyor", className: "bg-amber-100 text-amber-800" },
      PAID: { label: "Ödendi", className: "bg-green-100 text-green-800" },
      PAYMENT_SUCCESS: { label: "Ödeme Alındı", className: "bg-emerald-100 text-emerald-800" },
      PAYMENT_FAILED: { label: "Ödeme Başarısız", className: "bg-red-100 text-red-800" },
      PAYMENT_CAPTURE_FAILED: { label: "Tahsilat Başarısız", className: "bg-red-100 text-red-800" },
      PROCESSING: { label: "Hazırlanıyor", className: "bg-blue-100 text-blue-800" },
      PREPARING: { label: "Hazırlanıyor", className: "bg-blue-100 text-blue-800" },
      SHIPPED: { label: "Kargoya Verildi", className: "bg-purple-100 text-purple-800" },
      DELIVERED: { label: "Teslim Edildi", className: "bg-green-100 text-green-800" },
      COMPLETED: { label: "Tamamlandı", className: "bg-green-100 text-green-800" },
      CANCELLED: { label: "İptal Edildi", className: "bg-red-100 text-red-800" },
      DRAFT: { label: "Taslak", className: "bg-gray-100 text-gray-800" },
    };
    const statusInfo = statusMap[status] || { label: getOrderStatusLabel(status), className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={statusInfo.className}>
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
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab !== "ALL") {
      if (activeTab === "PENDING") {
        if (!["PENDING", "PENDING_PAYMENT", "PAID"].includes(order.status)) return false;
      } else if (activeTab === "PROCESSING") {
        if (!["PREPARING", "PROCESSING"].includes(order.status)) return false;
      } else if (order.status !== activeTab) {
        return false;
      }
    }

    if (paymentFilter !== "all" && order.paymentStatus !== paymentFilter) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.user.name.toLowerCase().includes(query) ||
        order.user.email.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.size === 0) {
      toast.error("Lütfen en az bir sipariş seçin");
      return;
    }

    try {
      setUpdatingStatus(true);
      const promises = Array.from(selectedOrders).map((orderId) => {
        if (action === "PROCESSING") {
          return fetch(`/api/admin/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "PROCESSING" }),
          });
        } else if (action === "SHIPPED") {
          return null; // Handled separately via tracking dialog
        } else if (action === "CANCELLED") {
          return fetch(`/api/admin/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CANCELLED" }),
          });
        }
        return Promise.resolve(null);
      });

      if (action === "SHIPPED") {
        setOrderToShip(null);
        setIsBulkTracking(true);
        setTrackingInput("");
        setTrackingDialogOpen(true);
        return;
      }

      await Promise.all(promises);
      toast.success(`${selectedOrders.size} sipariş güncellendi`);
      setSelectedOrders(new Set());
      fetchOrders();
    } catch (error) {
      toast.error("Toplu işlem sırasında bir hata oluştu");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const tabs = [
    { key: "ALL" as const, label: "Tüm Siparişler", count: orders.length },
    { key: "PENDING" as const, label: "Bekliyor", count: orders.filter((o) => ["PENDING", "PENDING_PAYMENT", "PAID"].includes(o.status)).length },
    { key: "PROCESSING" as const, label: "Hazırlanıyor", count: orders.filter((o) => ["PREPARING", "PROCESSING"].includes(o.status)).length },
    { key: "SHIPPED" as const, label: "Kargoda", count: orders.filter((o) => o.status === "SHIPPED").length },
    { key: "CANCELLED" as const, label: "İade", count: orders.filter((o) => o.status === "CANCELLED").length },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Tüm Siparişler</h1>
      </div>

      
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? "bg-gray-100" : "bg-gray-200"
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <Input
            placeholder="Sipariş no, müşteri adı veya e-posta ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Ödeme Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="PENDING">Ödeme Bekleniyor</SelectItem>
              <SelectItem value="PAID">Ödendi</SelectItem>
              <SelectItem value="FAILED">Başarısız</SelectItem>
              <SelectItem value="REFUNDED">İade Edildi</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(val) => {
            if (val === "high") {
              const params = new URLSearchParams(window.location.search);
              params.set("risk", "high");
              toast.info("Yüksek riskli siparişler filtreleniyor (Demo)");
            }
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Risk Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="high">Yüksek Risk (&gt;50)</SelectItem>
              <SelectItem value="low">Düşük Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedOrders.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("labels")}>
              <Download className="w-4 h-4 mr-2" />
              Etiket
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("invoice")}>
              <Download className="w-4 h-4 mr-2" />
              Fatura
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("SHIPPED")}
            >
              Kargoya Ver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedOrders(new Set())}
            >
              Seçimi Temizle
            </Button>
          </div>
        )}
      </div>

      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Sipariş bulunamadı
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
                      } else {
                        setSelectedOrders(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Ürünler</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Ödeme</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedOrders);
                        if (checked) {
                          newSelected.add(order.id);
                        } else {
                          newSelected.delete(order.id);
                        }
                        setSelectedOrders(newSelected);
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.user.name}</div>
                      <div className="text-sm text-muted-foreground">{order.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: tr })}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.items.length} ürün
                      {order.items.length > 0 && (
                        <div className="text-muted-foreground mt-1">
                          {order.items[0].productName}
                          {order.items.length > 1 && ` +${order.items.length - 1} ürün`}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.total.toFixed(2)} ₺
                  </TableCell>
                  <TableCell>
                    {order.riskScore && order.riskScore > 50 ? (
                      <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100">
                        {order.riskScore}
                      </Badge>
                    ) : (
                      <span className="text-green-600 text-sm font-medium">Güvenli</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin-orders/${order.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Detayları Görüntüle
                        </DropdownMenuItem>
                        {order.status !== "PREPARING" && order.status !== "PROCESSING" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order.id, "PROCESSING")}
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Hazırlanıyor Yap
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleCreateInvoice(order.id)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Fatura Oluştur
                        </DropdownMenuItem>
                        {order.status !== "SHIPPED" && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setOrderToShip(order.id);
                              setIsBulkTracking(false);
                              setTrackingInput("");
                              setTrackingDialogOpen(true);
                            }}
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Kargoya Ver
                          </DropdownMenuItem>
                        )}
                        {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order.id, "DELIVERED")}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Teslim Edildi İşaretle
                          </DropdownMenuItem>
                        )}
                        {order.status !== "CANCELLED" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setOrderToCancel(order.id);
                              setConfirmCancelOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            İptal Et
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sipariş Detayları - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              
              <div>
                <h3 className="font-semibold mb-2">Müşteri Bilgileri</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Ad:</strong> {selectedOrder.user.name}</p>
                  <p><strong>E-posta:</strong> {selectedOrder.user.email}</p>
                </div>
              </div>

              
              {selectedOrder.shippingAddress && (
                <div>
                  <h3 className="font-semibold mb-2">Teslimat Adresi</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>{selectedOrder.shippingAddress.district.name}</p>
                    <p>{selectedOrder.shippingAddress.fullAddress}</p>
                  </div>
                </div>
              )}

              
              <div>
                <h3 className="font-semibold mb-2">Ürünler</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      {item.product.image && (
                        <img
                          src={item.product.image}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        {(item.colorName || item.sizeName) && (
                          <p className="text-sm text-muted-foreground">
                            {item.colorName && `Renk: ${item.colorName}`}
                            {item.colorName && item.sizeName && " • "}
                            {item.sizeName && `Beden: ${item.sizeName}`}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Adet: {item.quantity} Ã— {item.unitPrice.toFixed(2)} ₺ = {item.totalPrice.toFixed(2)} ₺
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              
              <div>
                <h3 className="font-semibold mb-2">Fiyat Özeti</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Ara Toplam:</span>
                    <span>{selectedOrder.subtotal.toFixed(2)} ₺</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>İndirim:</span>
                      <span>-{selectedOrder.discount.toFixed(2)} ₺</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Kargo:</span>
                    <span>{selectedOrder.shippingCost.toFixed(2)} ₺</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Toplam:</span>
                    <span>{selectedOrder.total.toFixed(2)} ₺</span>
                  </div>
                </div>
              </div>

              
              <div className="flex gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Sipariş Durumu</h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Ödeme Durumu</h3>
                  {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                </div>
              </div>

              {selectedOrder.trackingNumber && (
                <div>
                  <h3 className="font-semibold mb-2">Kargo Takip No</h3>
                  <p className="bg-gray-50 p-4 rounded-lg">{selectedOrder.trackingNumber}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        onConfirm={() => {
          if (orderToCancel) {
            handleStatusChange(orderToCancel, "CANCELLED");
          }
        }}
        title="Siparişi İptal Et"
        description="Bu siparişi iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Siparişi İptal Et"
        cancelLabel="Vazgeç"
      />

      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kargo Bilgisi</DialogTitle>
            <DialogDescription>
              {isBulkTracking
                ? `${selectedOrders.size} sipariş için kargo takip numarası girin.`
                : "Seçili sipariş için kargo takip numarası girin."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Takip Numarası"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingDialogOpen(false)}>
              İptal
            </Button>
            <Button
              disabled={!trackingInput || updatingStatus}
              onClick={async () => {
                if (isBulkTracking) {
                  try {
                    setUpdatingStatus(true);
                    const promises = Array.from(selectedOrders).map((orderId) =>
                      fetch(`/api/admin/orders/${orderId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "SHIPPED", trackingNumber: trackingInput }),
                      })
                    );
                    await Promise.all(promises);
                    toast.success(`${selectedOrders.size} sipariş kargoya verildi`);
                    setSelectedOrders(new Set());
                    fetchOrders();
                  } catch (error) {
                    toast.error("Toplu işlem sırasında bir hata oluştu");
                  } finally {
                    setUpdatingStatus(false);
                    setTrackingDialogOpen(false);
                  }
                } else if (orderToShip) {
                  await handleStatusChange(orderToShip, "SHIPPED", trackingInput);
                  setTrackingDialogOpen(false);
                }
              }}
            >
              Kaydet ve Kargola
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
