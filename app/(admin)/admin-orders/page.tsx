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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreVertical, Eye, Package, Truck, CheckCircle, XCircle, Search, Bell, Download, Filter, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Order = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
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
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
  }, [statusFilter]);

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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Beklemede", className: "bg-yellow-100 text-yellow-800" },
      PREPARING: { label: "Hazırlanıyor", className: "bg-blue-100 text-blue-800" },
      SHIPPED: { label: "Kargoya Verildi", className: "bg-purple-100 text-purple-800" },
      DELIVERED: { label: "Teslim Edildi", className: "bg-green-100 text-green-800" },
      CANCELLED: { label: "İptal Edildi", className: "bg-red-100 text-red-800" },
    };
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={statusInfo.className}>
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
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.user.name.toLowerCase().includes(query) ||
      order.user.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Tüm Siparişler</h1>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Sipariş no, müşteri adı veya e-posta ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Durum Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="PENDING">Beklemede</SelectItem>
            <SelectItem value="PREPARING">Hazırlanıyor</SelectItem>
            <SelectItem value="SHIPPED">Kargoya Verildi</SelectItem>
            <SelectItem value="DELIVERED">Teslim Edildi</SelectItem>
            <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tablo */}
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
                <TableHead>Sipariş No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Ürünler</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Ödeme</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
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
                        {order.status !== "PREPARING" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order.id, "PREPARING")}
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Hazırlanıyor Yap
                          </DropdownMenuItem>
                        )}
                        {order.status !== "SHIPPED" && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                          <DropdownMenuItem
                            onClick={() => {
                              const tracking = prompt("Kargo takip numarası girin:");
                              if (tracking) {
                                handleStatusChange(order.id, "SHIPPED", tracking);
                              }
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
                              if (confirm("Siparişi iptal etmek istediğinize emin misiniz?")) {
                                handleStatusChange(order.id, "CANCELLED");
                              }
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

      {/* Sipariş Detay Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sipariş Detayları - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Müşteri Bilgileri */}
              <div>
                <h3 className="font-semibold mb-2">Müşteri Bilgileri</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Ad:</strong> {selectedOrder.user.name}</p>
                  <p><strong>E-posta:</strong> {selectedOrder.user.email}</p>
                </div>
              </div>

              {/* Teslimat Adresi */}
              {selectedOrder.shippingAddress && (
                <div>
                  <h3 className="font-semibold mb-2">Teslimat Adresi</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>{selectedOrder.shippingAddress.district.name}</p>
                    <p>{selectedOrder.shippingAddress.fullAddress}</p>
                  </div>
                </div>
              )}

              {/* Ürünler */}
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
                          Adet: {item.quantity} × {item.unitPrice.toFixed(2)} ₺ = {item.totalPrice.toFixed(2)} ₺
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fiyat Özeti */}
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

              {/* Durum Bilgileri */}
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
    </div>
  );
}
