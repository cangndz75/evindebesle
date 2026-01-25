"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import KPIStrip from "./_components/KPIStrip";
import SmartActionBar from "./_components/SmartActionBar";
import OrderOperations from "./_components/OrderOperations";
import StockHealth from "./_components/StockHealth";
import BusinessSnapshot from "./_components/BusinessSnapshot";
import ActionInbox from "./_components/ActionInbox";

type DashboardStats = {
  revenue: {
    total: number;
    change: number;
    previousTotal: number;
  };
  pendingOrders: {
    count: number;
    newLastHour: number;
  };
  todayAppointments: {
    count: number;
    change: number;
    cancelled: number;
  };
  stockAlarm: {
    count: number;
    lowStock: number;
    outOfStock: number;
    critical: number;
    change: number;
  };
};

type KPIData = {
  todayRevenue: {
    total: number;
    change: number;
    previousTotal: number;
  };
  weekRevenue: {
    total: number;
    change: number;
    previousTotal: number;
  };
  todayOrders: {
    count: number;
    change: number;
  };
  weekOrders: {
    count: number;
    change: number;
  };
  aov: {
    today: number;
    week: number;
    change: number;
  };
  cancellationRate: {
    rate: number;
    cancelled: number;
    refunded: number;
  };
  newCustomers: {
    today: number;
    week: number;
    change: number;
  };
  repeatRate: {
    rate: number;
    repeatCustomers: number;
    totalCustomers: number;
  };
  abandonedCart: {
    count: number;
    actionUrl: string;
  };
  returnRate: {
    rate: number;
    isHigh: boolean;
  };
  cargoDelay: {
    count: number;
    actionUrl: string;
  };
  criticalStock: {
    count: number;
    actionUrl: string;
  };
  profitMargin: {
    rate: number;
  };
  conversionRate: {
    rate: number;
  };
};

type ActionInboxItem = {
  type: string;
  count: number;
  label: string;
  action: string;
  priority: "high" | "medium" | "low";
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  timeAgo: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  items: Array<{
    product: {
      name: string;
      image: string | null;
    };
  }>;
};

type StockProduct = {
  id: string;
  name: string;
  image: string | null;
  minStock?: number;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  slug: string | null;
  totalSold?: number;
  createdAt?: string;
  stock?: number;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  orderCount: number;
  totalSpent: number;
};

type CustomerStats = {
  total: number;
  newLast7Days: number;
  newLast30Days: number;
  topCustomers: Customer[];
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<StockProduct[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("7days");
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [actionInbox, setActionInbox] = useState<ActionInboxItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"ops" | "growth">("ops");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        ordersRes,
        stockRes,
        kpiRes,
        actionInboxRes,
      ] = await Promise.all([
        fetch("/api/admin/dashboard-stats"),
        fetch("/api/admin/dashboard-orders?limit=20"),
        fetch("/api/admin/dashboard-stock-alert"),
        fetch("/api/admin/dashboard-kpis"),
        fetch("/api/admin/dashboard-action-inbox"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      if (stockRes.ok) {
        const stockData = await stockRes.json();
        // Stok verilerini düşük ve tükenen olarak ayır
        const lowStock = stockData.filter((p: any) => p.stock > 0 && p.stock <= 10);
        const outOfStock = stockData.filter((p: any) => p.stock === 0);
        setLowStockProducts(lowStock.map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.image ?? null,
          stock: p.stock,
          minStock: 5, // Varsayılan min stock
        })));
        setOutOfStockProducts(outOfStock.map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.image ?? null,
          stock: 0,
          minStock: 5,
        })));
      }

      if (kpiRes.ok) {
        const kpiData = await kpiRes.json();
        setKpiData(kpiData);
      }

      if (actionInboxRes.ok) {
        const actionInboxData = await actionInboxRes.json();
        setActionInbox(actionInboxData.items || []);
      }

      // Son siparişler, ürünler ve top ürünler
      const [recentOrdersRes, recentProductsRes, topProductsRes] = await Promise.all([
        fetch("/api/admin/dashboard-orders?limit=5"),
        fetch("/api/admin/dashboard-products?type=recent"),
        fetch("/api/admin/dashboard-products?type=top-selling"),
      ]);

      if (recentOrdersRes.ok) {
        const recentOrdersData = await recentOrdersRes.json();
        setRecentOrders(recentOrdersData);
      }

      if (recentProductsRes.ok) {
        const recentProductsData = await recentProductsRes.json();
        setRecentProducts(recentProductsData);
      }

      if (topProductsRes.ok) {
        const topProductsData = await topProductsRes.json();
        setTopProducts(topProductsData);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };


  // Verileri yeni component'lere uygun formata dönüştür
  const smartActions = useMemo(() => actionInbox.map((item) => ({
    type: item.type.includes("order") || item.type.includes("ship") || item.type.includes("payment") || item.type.includes("refund")
      ? ("order" as const)
      : item.type.includes("stock") || item.type.includes("product")
        ? ("stock" as const)
        : ("appointment" as const),
    message: item.label,
    count: item.count,
    href: item.action,
    priority: item.priority as "high" | "medium" | "low",
  })), [actionInbox]);

  const orderOperationsData = useMemo(() => orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber || `#${order.id.slice(0, 8)}`,
    customerName: order.user?.name || "Bilinmeyen Müşteri",
    total: order.total || 0,
    status: order.status as "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED",
    createdAt: order.createdAt?.toString() || new Date().toISOString(),
    itemCount: order.items?.length || 0,
  })), [orders]);

  const stockHealthData = useMemo(() => ({
    lowStockProducts: lowStockProducts.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image ?? undefined,
      stock: p.stock || 0,
      minStock: p.minStock,
      isOutOfStock: false,
    })),
    outOfStockProducts: outOfStockProducts.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image ?? undefined,
      stock: 0,
      minStock: p.minStock,
      isOutOfStock: true,
    })),
  }), [lowStockProducts, outOfStockProducts]);

  const [revenueChartData, setRevenueChartData] = useState<Array<{ date: string; revenue: number }>>([]);

  useEffect(() => {
    fetch("/api/admin/revenue-stats")
      .then((res) => res.json())
      .then(setRevenueChartData)
      .catch(console.error);
  }, []);

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">

      {/* 🟥 1.1 KPI ŞERİDİ (YENİ) */}
      {kpiData && stats ? (
        <KPIStrip
          data={{
            revenue: {
              value: formatPrice(kpiData.todayRevenue.total),
              change: `${kpiData.todayRevenue.change > 0 ? "+" : ""}%${Math.abs(kpiData.todayRevenue.change)}`,
              isPositive: kpiData.todayRevenue.change >= 0,
            },
            orders: {
              value: kpiData.todayOrders.count.toString(),
              change: `${kpiData.todayOrders.change > 0 ? "+" : ""}%${Math.abs(kpiData.todayOrders.change)}`,
              isPositive: kpiData.todayOrders.change >= 0,
            },
            aov: {
              value: formatPrice(kpiData.aov.today),
              change: `${kpiData.aov.change > 0 ? "+" : ""}%${Math.abs(kpiData.aov.change)}`,
              isPositive: kpiData.aov.change >= 0,
            },
            conversion: {
              value: `%${kpiData.conversionRate.rate}`,
              tooltip: "Ziyaret -> Sipariş Dönüşümü",
            },
            abandonedCart: {
              value: kpiData.abandonedCart.count,
              actionUrl: kpiData.abandonedCart.actionUrl,
            },
            returnRate: {
              value: `%${kpiData.returnRate.rate.toFixed(1)}`,
              isHigh: kpiData.returnRate.isHigh,
            },
            cargoDelay: {
              value: kpiData.cargoDelay.count,
              actionUrl: kpiData.cargoDelay.actionUrl,
            },
            criticalStock: {
              value: kpiData.criticalStock.count,
              actionUrl: kpiData.criticalStock.actionUrl,
            },
          }}
        />
      ) : (
        <div className="flex gap-4 overflow-hidden pb-4 -mx-6 px-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-48 shrink-0 rounded-xl bg-white" />
          ))}
        </div>
      )}

      {/* 🟦 A) SMART ACTION BAR (ÜST KISIM) */}
      <SmartActionBar actions={smartActions} />


      {/* 🟩 B) OPERASYON + İÇGÖRÜ (ANA GÖVDE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1️⃣ Sipariş Operasyon Alanı (SOL PANEL - Kompakt) */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardContent className="p-12">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <OrderOperations
              orders={orderOperationsData}
              onStatusChange={handleOrderStatusChange}
            />
          )}

          {/* Stok & Ürün Sağlığı (Alt kısım) */}
          {loading ? (
            <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardContent className="p-12">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <StockHealth
              lowStockProducts={stockHealthData.lowStockProducts}
              outOfStockProducts={stockHealthData.outOfStockProducts}
            />
          )}
        </div>

        {/* 2️⃣ Action Inbox (SAĞ PANEL) */}
        <div>
          {loading ? (
            <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
              <CardContent className="p-12">
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <ActionInbox items={actionInbox} />
          )}
        </div>
      </div>

      {/* 🟨 C) BUSINESS SNAPSHOT (ALT KISIM - SEKMELİ) */}
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-gray-100">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveTab("ops")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "ops"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Ops
            </button>
            <button
              onClick={() => setActiveTab("growth")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "growth"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Growth
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {activeTab === "ops" ? (
            <div className="space-y-6">
              {/* Ops içeriği - şu an boş, ileride eklenebilir */}
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">Operasyon detayları burada gösterilecek</p>
              </div>
            </div>
          ) : (
            kpiData && (
              <BusinessSnapshot
                revenue={{
                  total: kpiData.todayRevenue.total,
                  change: kpiData.todayRevenue.change,
                  previousTotal: kpiData.todayRevenue.previousTotal,
                }}
                orders={{
                  count: kpiData.todayOrders.count,
                  change: kpiData.todayOrders.change,
                }}
                aov={{
                  today: kpiData.aov.today,
                  change: kpiData.aov.change,
                }}
                chartData={revenueChartData}
                recentOrders={recentOrders.map((order) => ({
                  id: order.id,
                  orderNumber: order.orderNumber || `#${order.id.slice(0, 8)}`,
                  total: order.total || 0,
                  createdAt: order.createdAt?.toString() || new Date().toISOString(),
                  user: { name: order.user?.name || "Bilinmeyen" },
                }))}
                recentProducts={recentProducts.map((product) => ({
                  id: product.id,
                  name: product.name,
                  image: product.image,
                  price: product.price,
                  createdAt: product.createdAt?.toString() || new Date().toISOString(),
                }))}
                topProducts={topProducts.map((product) => ({
                  id: product.id,
                  name: product.name,
                  image: product.image,
                  price: product.price,
                  totalSold: product.totalSold,
                }))}
              />
            )
          )}
        </CardContent>
      </Card>

      {/* Bildirim Gönder Modal */}
      <Dialog open={notificationModalOpen} onOpenChange={setNotificationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Toplu Bildirim Gönder</DialogTitle>
            <DialogDescription>
              Tüm kullanıcılara veya belirli bir gruba bildirim gönderebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="notification-message">Bildirim Mesajı</Label>
              <Textarea
                id="notification-message"
                placeholder="Bildirim mesajınızı buraya yazın..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                className="mt-2 min-h-[120px]"
              />
            </div>
            <div>
              <Label>Hedef Kitle</Label>
              <Select defaultValue="all">
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                  <SelectItem value="premium">Premium Üyeler</SelectItem>
                  <SelectItem value="active">Aktif Kullanıcılar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationModalOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => {
                // TODO: API call
                alert("Bildirim gönderildi!");
                setNotificationModalOpen(false);
                setNotificationMessage("");
              }}
            >
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rapor İndir Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rapor İndir</DialogTitle>
            <DialogDescription>
              İstediğiniz rapor türünü seçin ve indirin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rapor Türü</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Satış Raporu</SelectItem>
                  <SelectItem value="products">Ürün Raporu</SelectItem>
                  <SelectItem value="customers">Müşteri Raporu</SelectItem>
                  <SelectItem value="orders">Sipariş Raporu</SelectItem>
                  <SelectItem value="revenue">Gelir Raporu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tarih Aralığı</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Bugün</SelectItem>
                  <SelectItem value="7days">Son 7 Gün</SelectItem>
                  <SelectItem value="30days">Son 30 Gün</SelectItem>
                  <SelectItem value="90days">Son 90 Gün</SelectItem>
                  <SelectItem value="custom">Özel Tarih Aralığı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <Select defaultValue="excel">
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => {
                // TODO: API call
                alert(`${reportType} raporu indiriliyor...`);
                setReportModalOpen(false);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              İndir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
