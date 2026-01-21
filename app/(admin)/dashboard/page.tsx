"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  CalendarIcon,
  Download,
  Plus,
  Package,
  ShoppingCart,
  Users,
  PawPrint,
  Briefcase,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  ArrowRight,
  AlertTriangle,
  Settings,
  Eye,
  CheckCircle,
  XCircle,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RevenueChart from "./_components/RevenueChart";
import { AddProductModal } from "../admin-products/AddProduct";

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
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [stockTypeFilter, setStockTypeFilter] = useState("low");
  const [dateRange, setDateRange] = useState("7days");
  const [productTab, setProductTab] = useState<"best-selling" | "recent" | "low-stock">("best-selling");
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [reportType, setReportType] = useState("sales");
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [actionInbox, setActionInbox] = useState<ActionInboxItem[]>([]);

  const quickActions = [
    {
      label: "Yeni Ürün",
      icon: <Plus className="w-5 h-5" />,
      href: null,
      isModal: true,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: "Kupon Oluştur",
      icon: <Package className="w-5 h-5" />,
      href: "/coupons",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      label: "Hizmet Ekle",
      icon: <Briefcase className="w-5 h-5" />,
      href: "/admin-services",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      label: "Randevu Oluştur",
      icon: <CalendarIcon className="w-5 h-5" />,
      href: "/admin-appointments",
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      label: "Kullanıcı Ara",
      icon: <Users className="w-5 h-5" />,
      href: "/users",
      color: "bg-pink-500 hover:bg-pink-600",
    },
    {
      label: "Rapor İndir",
      icon: <Download className="w-5 h-5" />,
      href: null,
      onClick: () => setReportModalOpen(true),
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
    {
      label: "Stok Güncelle",
      icon: <Package className="w-5 h-5" />,
      href: "/admin-products",
      color: "bg-yellow-500 hover:bg-yellow-600",
    },
    {
      label: "Bildirim Gönder",
      icon: <Bell className="w-5 h-5" />,
      href: null,
      onClick: () => setNotificationModalOpen(true),
      color: "bg-red-500 hover:bg-red-600",
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, [orderStatusFilter, stockTypeFilter]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        ordersRes,
        stockRes,
        bestSellingRes,
        recentRes,
        customersRes,
        kpiRes,
        actionInboxRes,
      ] = await Promise.all([
        fetch("/api/admin/dashboard-stats"),
        fetch(`/api/admin/dashboard-orders?status=${orderStatusFilter}&limit=10`),
        fetch(`/api/admin/dashboard-stock-alert?type=${stockTypeFilter}`),
        fetch("/api/admin/dashboard-products?type=best-selling"),
        fetch("/api/admin/dashboard-products?type=recent"),
        fetch("/api/admin/dashboard-customers"),
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
        if (stockTypeFilter === "out") {
          setOutOfStockProducts(stockData);
        } else {
          setLowStockProducts(stockData);
        }
      }

      if (bestSellingRes.ok) {
        const bestSellingData = await bestSellingRes.json();
        setBestSellingProducts(bestSellingData);
      }

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentProducts(recentData);
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomerStats(customersData);
      }

      if (kpiRes.ok) {
        const kpiData = await kpiRes.json();
        setKpiData(kpiData);
      }

      if (actionInboxRes.ok) {
        const actionInboxData = await actionInboxRes.json();
        setActionInbox(actionInboxData.items || []);
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Bekliyor", className: "bg-yellow-100 text-yellow-800" },
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      {/* Action Inbox - Bildirim ve Görev Kutusu */}
      {actionInbox.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-bold text-gray-900">Hızlı Aksiyonlar</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {actionInbox.length} görev
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {actionInbox.map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-start gap-2 hover:shadow-md transition-all ${
                    item.priority === "high"
                      ? "border-red-200 bg-red-50 hover:bg-red-100"
                      : item.priority === "medium"
                      ? "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => router.push(item.action)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold">{item.label}</span>
                    {item.priority === "high" && (
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </div>
                  <span className="text-xs text-gray-600">Hemen işlem yap →</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {quickActions.map((action, index) =>
          action.isModal ? (
            <AddProductModal
              key={index}
              onSuccess={loadDashboardData}
            >
              <Button
                className={`w-full ${action.color} text-white flex flex-col items-center justify-center gap-2 h-24 text-xs font-medium rounded-xl shadow-sm hover:shadow-md transition-all`}
              >
                {action.icon}
                {action.label}
              </Button>
            </AddProductModal>
          ) : (
            <Button
              key={index}
              onClick={() => {
                if (action.onClick) {
                  action.onClick();
                } else if (action.href) {
                  router.push(action.href);
                }
              }}
              className={`w-full ${action.color} text-white flex flex-col items-center justify-center gap-2 h-24 text-xs font-medium rounded-xl shadow-sm hover:shadow-md transition-all`}
            >
              {action.icon}
              {action.label}
            </Button>
          )
        )}
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (stats || kpiData) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bugünkü Ciro - Zaten var, sadece düzenleme yapıldı */}
          {/* Bugünkü Ciro */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin-orders")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Bugünkü Ciro</CardTitle>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-3xl font-bold text-gray-900">
                  {kpiData ? formatPrice(kpiData.todayRevenue.total) : formatPrice(stats?.revenue.total || 0)}
                </p>
                {kpiData && (
                  <span className={`text-sm font-semibold ${kpiData.todayRevenue.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {kpiData.todayRevenue.change >= 0 ? "+" : ""}
                    {kpiData.todayRevenue.change.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center mb-3">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-green-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Son 7 güne göre {kpiData ? formatPrice(kpiData.todayRevenue.total - kpiData.todayRevenue.previousTotal) : formatPrice(stats?.revenue.total || 0)}
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs ml-1 font-medium"
                  onClick={() => router.push("/admin-orders")}
                >
                  Detaylı rapor →
                </Button>
              </p>
            </CardContent>
          </Card>

          {/* Sipariş Adedi */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin-orders")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Sipariş Adedi</CardTitle>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-3xl font-bold text-gray-900">
                  {kpiData ? kpiData.todayOrders.count : stats?.pendingOrders.count || 0} sipariş
                </p>
                {kpiData && kpiData.todayOrders.change !== 0 && (
                  <span className={`text-sm font-semibold ${kpiData.todayOrders.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {kpiData.todayOrders.change >= 0 ? "+" : ""}
                    {kpiData.todayOrders.change.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center mb-3">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-blue-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Son 7 günde {kpiData ? kpiData.weekOrders.count : 0} sipariş
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs ml-1 font-medium"
                  onClick={() => router.push("/admin-orders")}
                >
                  Tümünü gör →
                </Button>
              </p>
            </CardContent>
          </Card>

          {/* Ortalama Sepet (AOV) */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin-orders")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Ortalama Sepet</CardTitle>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-3xl font-bold text-gray-900">
                  {kpiData ? formatPrice(kpiData.aov.today) : "0 ₺"}
                </p>
                {kpiData && kpiData.aov.change !== 0 && (
                  <span className={`text-sm font-semibold ${kpiData.aov.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {kpiData.aov.change >= 0 ? "+" : ""}
                    {kpiData.aov.change.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center mb-3">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-purple-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Haftalık ortalama: {kpiData ? formatPrice(kpiData.aov.week) : "0 ₺"}
              </p>
            </CardContent>
          </Card>

          {/* İade/İptal Oranı */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin-orders?status=CANCELLED")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">İade/İptal Oranı</CardTitle>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-3xl font-bold text-gray-900">
                  {kpiData ? kpiData.cancellationRate.rate.toFixed(1) : "0"}%
                </p>
              </div>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center mb-3">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-orange-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">
                {kpiData ? `${kpiData.cancellationRate.cancelled} iptal, ${kpiData.cancellationRate.refunded} iade` : "0 iptal, 0 iade"}
              </p>
            </CardContent>
          </Card>

          {/* Kargoya Hazır */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin-orders?status=PREPARING")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Kargoya Hazır</CardTitle>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-3xl font-bold text-gray-900">
                  {orders.filter((o) => o.status === "PREPARING").length} sipariş
                </p>
                <span className="text-sm font-semibold text-green-600">+15.7%</span>
              </div>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center mb-3">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-purple-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">
                {orders.filter((o) => o.status === "PREPARING").length} sipariş hazır
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs ml-1 font-medium"
                  onClick={() => router.push("/admin-orders?status=PREPARING")}
                >
                  Kargoya ver →
                </Button>
              </p>
            </CardContent>
          </Card>

          {/* Bugünkü Randevu */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Bugünkü Randevu</CardTitle>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {stats?.todayAppointments.count || 0} randevu
              </p>
              <div className="flex items-center gap-1 mb-3">
                {stats && stats.todayAppointments.change >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                {stats && (
                  <span
                    className={`text-sm font-semibold ${
                      stats.todayAppointments.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stats.todayAppointments.change >= 0 ? "+" : ""}
                    {stats.todayAppointments.change.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center mb-3">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-blue-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">
                {stats?.todayAppointments.cancelled || 0} iptal edildi
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs ml-1 font-medium"
                  onClick={() => router.push("/admin-appointments")}
                >
                  Randevulara git →
                </Button>
              </p>
            </CardContent>
          </Card>

          {/* Stok Alarmı */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Stok Alarmı</CardTitle>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {stats?.stockAlarm.count || 0} ürün
              </p>
              <div className="flex items-center gap-1 mb-3">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-600">+3%</span>
              </div>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center mb-3">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-red-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">
                {stats?.stockAlarm.critical || 0} ürün kritik seviyede
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs ml-1 font-medium"
                  onClick={() => router.push("/admin-products")}
                >
                  Stok güncelle →
                </Button>
              </p>
            </CardContent>
          </Card>

          {/* Yeni Müşteri */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/users")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Yeni Müşteri</CardTitle>
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-pink-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-3xl font-bold text-gray-900">
                  {kpiData ? kpiData.newCustomers.today : 0}
                </p>
                {kpiData && kpiData.newCustomers.change !== 0 && (
                  <span className={`text-sm font-semibold ${kpiData.newCustomers.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {kpiData.newCustomers.change >= 0 ? "+" : ""}
                    {kpiData.newCustomers.change.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center mb-3">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-pink-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Son 7 günde {kpiData ? kpiData.newCustomers.week : 0} yeni müşteri
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs ml-1 font-medium"
                  onClick={() => router.push("/users")}
                >
                  Tümünü gör →
                </Button>
              </p>
            </CardContent>
          </Card>

          {/* Tekrar Eden Müşteri (Repeat Rate) */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/users")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Tekrar Eden Müşteri</CardTitle>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-3xl font-bold text-gray-900">
                  {kpiData ? kpiData.repeatRate.rate.toFixed(1) : "0"}%
                </p>
              </div>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center mb-3">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-indigo-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">
                {kpiData ? `${kpiData.repeatRate.repeatCustomers} / ${kpiData.repeatRate.totalCustomers} müşteri` : "0 müşteri"}
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs ml-1 font-medium"
                  onClick={() => router.push("/users")}
                >
                  Detaylı rapor →
                </Button>
              </p>
            </CardContent>
          </Card>

          {/* Kâr Marjı */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin-orders")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Kâr Marjı</CardTitle>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-3xl font-bold text-gray-900">
                  {kpiData ? kpiData.profitMargin.rate.toFixed(1) : "0"}%
                </p>
              </div>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center mb-3">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-emerald-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Net kâr marjı oranı
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs ml-1 font-medium"
                  onClick={() => router.push("/admin-orders")}
                >
                  Detaylı rapor →
                </Button>
              </p>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/admin-orders")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Conversion Rate</CardTitle>
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-cyan-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-3xl font-bold text-gray-900">
                  {kpiData ? kpiData.conversionRate.rate.toFixed(1) : "0"}%
                </p>
              </div>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center mb-3">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-cyan-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Ziyaretçi → Sipariş dönüşüm oranı
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs ml-1 font-medium"
                  onClick={() => router.push("/admin-orders")}
                >
                  Detaylı rapor →
                </Button>
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Sipariş Operasyon Merkezi */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">Sipariş Operasyon Merkezi</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin-orders")}
              className="text-xs"
            >
              Tümünü gör →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => router.push("/admin-orders?status=PENDING")}
            >
              <Package className="w-6 h-6 text-blue-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">
                  {orders.filter((o) => o.status === "PENDING").length}
                </p>
                <p className="text-xs text-gray-600">Bekleyen</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-yellow-50 hover:border-yellow-300"
              onClick={() => router.push("/admin-orders?status=PREPARING")}
            >
              <Package className="w-6 h-6 text-yellow-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">
                  {orders.filter((o) => o.status === "PREPARING").length}
                </p>
                <p className="text-xs text-gray-600">Hazırlanıyor</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300"
              onClick={() => router.push("/admin-orders?status=SHIPPED")}
            >
              <Truck className="w-6 h-6 text-purple-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">
                  {orders.filter((o) => o.status === "SHIPPED").length}
                </p>
                <p className="text-xs text-gray-600">Kargoda</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300"
              onClick={() => router.push("/admin-orders?status=DELIVERED")}
            >
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">
                  {orders.filter((o) => o.status === "DELIVERED").length}
                </p>
                <p className="text-xs text-gray-600">Teslim Edildi</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300"
              onClick={() => router.push("/admin-orders?status=CANCELLED")}
            >
              <XCircle className="w-6 h-6 text-red-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">
                  {orders.filter((o) => o.status === "CANCELLED").length}
                </p>
                <p className="text-xs text-gray-600">İptal/İade</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stok ve Ürün Sağlığı */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">Stok ve Ürün Sağlığı</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin-products")}
              className="text-xs"
            >
              Tümünü gör →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300"
              onClick={() => router.push("/admin-products?stockStatus=lowStock")}
            >
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">{stats?.stockAlarm.lowStock || 0}</p>
                <p className="text-xs text-gray-600">Düşük Stok</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300"
              onClick={() => router.push("/admin-products?stockStatus=outOfStock")}
            >
              <XCircle className="w-6 h-6 text-orange-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">{stats?.stockAlarm.outOfStock || 0}</p>
                <p className="text-xs text-gray-600">Tükendi</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-yellow-50 hover:border-yellow-300"
              onClick={() => router.push("/admin-products?sortBy=newest")}
            >
              <Package className="w-6 h-6 text-yellow-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">{recentProducts.length}</p>
                <p className="text-xs text-gray-600">Yeni Ürünler</p>
              </div>
            </Button>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">Hızlı Aksiyonlar:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin-products?stockStatus=lowStock")}
              >
                Düşük Stoklu Ürünleri Gör
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin-products?stockStatus=outOfStock")}
              >
                Tükenen Ürünleri Gör
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin-products")}
              >
                Tüm Ürünleri Yönet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Son Siparişler */}
        <Card className="lg:col-span-2 bg-white border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Son Siparişler</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin-orders")}
                className="text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Tümünü gör →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
              <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100">
                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Tümü
                </TabsTrigger>
                <TabsTrigger value="PENDING" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Bekliyor
                </TabsTrigger>
                <TabsTrigger value="PREPARING" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Hazırlanıyor
                </TabsTrigger>
                <TabsTrigger value="DELIVERED" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Tamamlandı
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sipariş bulunamadı</p>
            ) : (
              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SİPARİŞ NO</TableHead>
                      <TableHead>MÜŞTERİ</TableHead>
                      <TableHead>TUTAR</TableHead>
                      <TableHead>DURUM</TableHead>
                      <TableHead>ZAMAN</TableHead>
                      <TableHead className="text-right">İŞLEMLER</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={order.user.image || ""} />
                              <AvatarFallback className="text-xs">
                                {getInitials(order.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{order.user.name}</p>
                              <p className="text-xs text-muted-foreground">{order.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatPrice(order.total)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {order.timeAgo}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/admin-orders?id=${order.id}`)}>
                                Detayları Gör
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stok Alarmı */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Stok Alarmı</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="font-semibold">
                  {stats?.stockAlarm.count || 0}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={stockTypeFilter} onValueChange={setStockTypeFilter}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                <TabsTrigger value="low" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Düşük Stok ({stats?.stockAlarm.lowStock || 0})
                </TabsTrigger>
                <TabsTrigger value="out" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Tükendi ({stats?.stockAlarm.outOfStock || 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (stockTypeFilter === "out" ? outOfStockProducts : lowStockProducts).length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                {stockTypeFilter === "out" ? "Tükenen ürün yok" : "Düşük stoklu ürün yok"}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {(stockTypeFilter === "out" ? outOfStockProducts : lowStockProducts)
                  .slice(0, 5)
                  .map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate mb-1">{product.name}</p>
                        <p className="text-xs text-gray-600 font-medium">
                          {product.stock === 0
                            ? "Tükendi"
                            : `${product.stock} adet kaldı`}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin-products?productId=${product.id}`)}
                        className="flex-shrink-0"
                      >
                        Güncelle
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* İkinci Satır - Ürünler ve Müşteriler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* En Çok Satan Ürünler / Son Eklenen Ürünler */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Ürün Analizi</CardTitle>
              <Tabs value={productTab} onValueChange={(v) => setProductTab(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="best-selling" className="text-xs">Çok Satan</TabsTrigger>
                  <TabsTrigger value="recent" className="text-xs">Yeni</TabsTrigger>
                  <TabsTrigger value="low-stock" className="text-xs">Düşük Stok</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(productTab === "best-selling"
                  ? bestSellingProducts
                  : productTab === "recent"
                  ? recentProducts
                  : lowStockProducts
                )
                  .slice(0, 5)
                  .map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{product.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {"price" in product && (
                              <p className="text-xs font-medium text-gray-600">
                                {formatPrice(product.price)}
                              </p>
                            )}
                            {productTab === "best-selling" && "totalSold" in product && product.totalSold && (
                              <span className="text-xs text-gray-500">
                                {product.totalSold} adet satıldı
                              </span>
                            )}
                            {productTab === "low-stock" && "stock" in product && product.stock !== undefined && (
                              <span className="text-xs text-red-600 font-medium">
                                {product.stock} adet kaldı
                              </span>
                            )}
                            {productTab === "recent" && "createdAt" in product && product.createdAt && (
                              <span className="text-xs text-gray-500">
                                {format(new Date(product.createdAt), "dd MMM", { locale: tr })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin-products?productId=${product.id}`)}
                        className="flex-shrink-0"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                {((productTab === "best-selling" && bestSellingProducts.length === 0) ||
                  (productTab === "recent" && recentProducts.length === 0) ||
                  (productTab === "low-stock" && lowStockProducts.length === 0)) && (
                  <p className="text-center text-gray-500 py-8 text-sm">Ürün bulunamadı</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Müşteri İstatistikleri */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Müşteri İstatistikleri</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/users")}
                className="text-xs"
              >
                Tümünü gör →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : customerStats ? (
              <div className="space-y-6">
                {/* Özet İstatistikler */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{customerStats.total}</p>
                    <p className="text-xs text-gray-600 mt-1">Toplam Müşteri</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {customerStats.newLast7Days}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Son 7 Gün</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {customerStats.newLast30Days}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Son 30 Gün</p>
                  </div>
                </div>

                {/* En Çok Sipariş Veren Müşteriler */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">
                    En Çok Sipariş Veren Müşteriler
                  </h4>
                  <div className="space-y-2">
                    {customerStats.topCustomers.slice(0, 5).map((customer, index) => (
                      <div
                        key={customer.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                          {index + 1}
                        </div>
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={customer.image || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{customer.name}</p>
                          <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold">{customer.orderCount} sipariş</p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(customer.totalSpent)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {customerStats.topCustomers.length === 0 && (
                      <p className="text-center text-gray-500 py-4 text-sm">
                        Müşteri bulunamadı
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Randevu ve Hizmet Yönetimi */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">Randevu ve Hizmet Yönetimi</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin-appointments")}
              className="text-xs"
            >
              Tümünü gör →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => router.push("/admin-appointments?status=SCHEDULED&filter=today")}
            >
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">{stats?.todayAppointments.count || 0}</p>
                <p className="text-xs text-gray-600">Bugünkü Randevu</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300"
              onClick={() => router.push("/admin-appointments?status=SCHEDULED&filter=upcoming")}
            >
              <CalendarIcon className="w-6 h-6 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">
                  {actionInbox.find((item) => item.type === "upcomingAppointments")?.count || 0}
                </p>
                <p className="text-xs text-gray-600">Yaklaşan</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300"
              onClick={() => router.push("/admin-appointments?status=CANCELED")}
            >
              <XCircle className="w-6 h-6 text-red-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">
                  {actionInbox.find((item) => item.type === "cancelledAppointments")?.count || stats?.todayAppointments.cancelled || 0}
                </p>
                <p className="text-xs text-gray-600">İptal Edilen</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300"
              onClick={() => router.push("/admin-services")}
            >
              <Briefcase className="w-6 h-6 text-purple-600" />
              <div className="text-center">
                <p className="font-semibold text-lg">-</p>
                <p className="text-xs text-gray-600">Hizmet Kapasitesi</p>
              </div>
            </Button>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">Hızlı Aksiyonlar:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin-appointments?status=SCHEDULED&filter=today")}
              >
                Bugünkü Randevuları Gör
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin-appointments?status=SCHEDULED&filter=upcoming")}
              >
                Yaklaşan Randevuları Gör
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin-appointments?status=CANCELED")}
              >
                İptal Edilen Randevular
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin-services")}
              >
                Hizmetleri Yönet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gelir Karşılaştırması: Hizmet vs Ürün */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Gelir Karşılaştırması</CardTitle>
              <CardDescription className="mt-1">Hizmet (Randevu) vs Ürün Siparişleri</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Hizmet Geliri</h3>
                </div>
                <Badge className="bg-blue-600">Randevular</Badge>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {kpiData ? formatPrice(kpiData.weekRevenue.total * 0.4) : "0 ₺"}
              </p>
              <p className="text-sm text-gray-600">Son 7 gün</p>
              <div className="mt-4 h-24 bg-white rounded flex items-center justify-center">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-blue-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Ürün Geliri</h3>
                </div>
                <Badge className="bg-green-600">Siparişler</Badge>
              </div>
              <p className="text-3xl font-bold text-green-600 mb-2">
                {kpiData ? formatPrice(kpiData.weekRevenue.total * 0.6) : "0 ₺"}
              </p>
              <p className="text-sm text-gray-600">Son 7 gün</p>
              <div className="mt-4 h-24 bg-white rounded flex items-center justify-center">
                <div className="w-full h-full flex items-end justify-between px-2 pb-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="w-6 bg-green-500 rounded-t"
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Toplam Gelir:</span>
              <span className="text-lg font-bold text-gray-900">
                {kpiData ? formatPrice(kpiData.weekRevenue.total) : "0 ₺"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              <span>Hizmet: %40</span>
              <span>•</span>
              <span>Ürün: %60</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gelir Grafiği */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Gelir Trendi (Son 7 Gün)</CardTitle>
              <CardDescription className="mt-1">Randevu ve ürün siparişlerinden toplam gelir</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <RevenueChart />
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
