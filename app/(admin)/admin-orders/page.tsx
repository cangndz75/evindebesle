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
  status: "PENDING" | "PAID" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
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
  const [activeTab, setActiveTab] = useState<"ALL" | "PAID" | "PREPARING" | "SHIPPED" | "CANCELLED">("ALL");
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
      toast.error("SipariÅŸler yÃ¼klenirken bir hata oluÅŸtu");
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
        toast.success("SipariÅŸ durumu gÃ¼ncellendi");
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          const updated = await res.json();
          setSelectedOrder(updated.order);
        }
      } else {
        throw new Error("GÃ¼ncelleme baÅŸarÄ±sÄ±z");
      }
    } catch (error) {
      toast.error("SipariÅŸ durumu gÃ¼ncellenirken bir hata oluÅŸtu");
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
        toast.success("Fatura baÅŸarÄ±yla oluÅŸturuldu");
        router.push(`/admin-invoices/${invoice.id}`);
      } else {
        const msg = await res.text();
        toast.error(msg || "Fatura oluÅŸturulamadÄ±");
      }
    } catch (error) {
      toast.error("Bir hata oluÅŸtu");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Beklemede", className: "bg-yellow-100 text-yellow-800" },
      PAID: { label: "Ã–dendi", className: "bg-green-100 text-green-800" },
      PREPARING: { label: "HazÄ±rlanÄ±yor", className: "bg-blue-100 text-blue-800" },
      SHIPPED: { label: "Kargoya Verildi", className: "bg-purple-100 text-purple-800" },
      DELIVERED: { label: "Teslim Edildi", className: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Ä°ptal Edildi", className: "bg-red-100 text-red-800" },
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
      PENDING: { label: "Ã–deme Bekleniyor", className: "bg-gray-100 text-gray-800" },
      PAID: { label: "Ã–dendi", className: "bg-green-100 text-green-800" },
      FAILED: { label: "BaÅŸarÄ±sÄ±z", className: "bg-red-100 text-red-800" },
      REFUNDED: { label: "Ä°ade Edildi", className: "bg-orange-100 text-orange-800" },
    };
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab !== "ALL") {
      if (order.status !== activeTab) return false;
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
      toast.error("LÃ¼tfen en az bir sipariÅŸ seÃ§in");
      return;
    }

    try {
      setUpdatingStatus(true);
      const promises = Array.from(selectedOrders).map((orderId) => {
        if (action === "PREPARING") {
          return fetch(`/api/admin/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "PREPARING" }),
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
      toast.success(`${selectedOrders.size} sipariÅŸ gÃ¼ncellendi`);
      setSelectedOrders(new Set());
      fetchOrders();
    } catch (error) {
      toast.error("Toplu iÅŸlem sÄ±rasÄ±nda bir hata oluÅŸtu");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const tabs = [
    { key: "ALL" as const, label: "TÃ¼m SipariÅŸler", count: orders.length },
    { key: "PAID" as const, label: "Yeni SipariÅŸler", count: orders.filter((o) => o.status === "PAID").length },
    { key: "PREPARING" as const, label: "HazÄ±rlanÄ±yor", count: orders.filter((o) => o.status === "PREPARING").length },
    { key: "SHIPPED" as const, label: "Kargoda", count: orders.filter((o) => o.status === "SHIPPED").length },
    { key: "CANCELLED" as const, label: "Ä°ade", count: orders.filter((o) => o.status === "CANCELLED").length },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">TÃ¼m SipariÅŸler</h1>
      </div>

      {/* Tab View */}
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

      {/* Filtreler ve Toplu Ä°ÅŸlemler */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <Input
            placeholder="SipariÅŸ no, mÃ¼ÅŸteri adÄ± veya e-posta ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Ã–deme Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">TÃ¼mÃ¼</SelectItem>
              <SelectItem value="PENDING">Ã–deme Bekleniyor</SelectItem>
              <SelectItem value="PAID">Ã–dendi</SelectItem>
              <SelectItem value="FAILED">BaÅŸarÄ±sÄ±z</SelectItem>
              <SelectItem value="REFUNDED">Ä°ade Edildi</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(val) => {
            if (val === "high") {
              const params = new URLSearchParams(window.location.search);
              params.set("risk", "high");
              toast.info("YÃ¼ksek riskli sipariÅŸler filtreleniyor (Demo)");
            }
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Risk Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">TÃ¼mÃ¼</SelectItem>
              <SelectItem value="high">YÃ¼ksek Risk (&gt;50)</SelectItem>
              <SelectItem value="low">DÃ¼ÅŸÃ¼k Risk</SelectItem>
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
              SeÃ§imi Temizle
            </Button>
          </div>
        )}
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
          SipariÅŸ bulunamadÄ±
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
                <TableHead>SipariÅŸ No</TableHead>
                <TableHead>MÃ¼ÅŸteri</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>ÃœrÃ¼nler</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Ã–deme</TableHead>
                <TableHead className="text-right">Ä°ÅŸlemler</TableHead>
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
                      {order.items.length} Ã¼rÃ¼n
                      {order.items.length > 0 && (
                        <div className="text-muted-foreground mt-1">
                          {order.items[0].productName}
                          {order.items.length > 1 && ` +${order.items.length - 1} Ã¼rÃ¼n`}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.total.toFixed(2)} â‚º
                  </TableCell>
                  <TableCell>
                    {order.riskScore && order.riskScore > 50 ? (
                      <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100">
                        {order.riskScore}
                      </Badge>
                    ) : (
                      <span className="text-green-600 text-sm font-medium">GÃ¼venli</span>
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
                          DetaylarÄ± GÃ¶rÃ¼ntÃ¼le
                        </DropdownMenuItem>
                        {order.status !== "PREPARING" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order.id, "PREPARING")}
                          >
                            <Package className="w-4 h-4 mr-2" />
                            HazÄ±rlanÄ±yor Yap
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleCreateInvoice(order.id)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Fatura OluÅŸtur
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
                            Teslim Edildi Ä°ÅŸaretle
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
                            Ä°ptal Et
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

      {/* SipariÅŸ Detay Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SipariÅŸ DetaylarÄ± - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* MÃ¼ÅŸteri Bilgileri */}
              <div>
                <h3 className="font-semibold mb-2">MÃ¼ÅŸteri Bilgileri</h3>
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

              {/* ÃœrÃ¼nler */}
              <div>
                <h3 className="font-semibold mb-2">ÃœrÃ¼nler</h3>
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
                            {item.colorName && item.sizeName && " â€¢ "}
                            {item.sizeName && `Beden: ${item.sizeName}`}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Adet: {item.quantity} Ã— {item.unitPrice.toFixed(2)} â‚º = {item.totalPrice.toFixed(2)} â‚º
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fiyat Ã–zeti */}
              <div>
                <h3 className="font-semibold mb-2">Fiyat Ã–zeti</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Ara Toplam:</span>
                    <span>{selectedOrder.subtotal.toFixed(2)} â‚º</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Ä°ndirim:</span>
                      <span>-{selectedOrder.discount.toFixed(2)} â‚º</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Kargo:</span>
                    <span>{selectedOrder.shippingCost.toFixed(2)} â‚º</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Toplam:</span>
                    <span>{selectedOrder.total.toFixed(2)} â‚º</span>
                  </div>
                </div>
              </div>

              {/* Durum Bilgileri */}
              <div className="flex gap-4">
                <div>
                  <h3 className="font-semibold mb-2">SipariÅŸ Durumu</h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Ã–deme Durumu</h3>
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
        title="SipariÅŸi Ä°ptal Et"
        description="Bu sipariÅŸi iptal etmek istediÄŸinize emin misiniz? Bu iÅŸlem geri alÄ±namaz."
        confirmLabel="SipariÅŸi Ä°ptal Et"
        cancelLabel="VazgeÃ§"
      />

      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kargo Bilgisi</DialogTitle>
            <DialogDescription>
              {isBulkTracking
                ? `${selectedOrders.size} sipariÅŸ iÃ§in kargo takip numarasÄ± girin.`
                : "SeÃ§ili sipariÅŸ iÃ§in kargo takip numarasÄ± girin."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Takip NumarasÄ±"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingDialogOpen(false)}>
              Ä°ptal
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
                    toast.success(`${selectedOrders.size} sipariÅŸ kargoya verildi`);
                    setSelectedOrders(new Set());
                    fetchOrders();
                  } catch (error) {
                    toast.error("Toplu iÅŸlem sÄ±rasÄ±nda bir hata oluÅŸtu");
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
