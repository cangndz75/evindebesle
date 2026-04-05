"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import KPIStrip from "./_components/KPIStrip";
import OrderOperations from "./_components/OrderOperations";
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
  todayOrders: {
    count: number;
    change: number;
  };
  aov: {
    today: number;
    week: number;
    change: number;
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

export default function AdminDashboard() {
  const router = useRouter();

  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [actionInbox, setActionInbox] = useState<ActionInboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, kpiRes, actionInboxRes] = await Promise.all([
        fetch("/api/admin/dashboard-orders?limit=20"),
        fetch("/api/admin/dashboard-kpis"),
        fetch("/api/admin/dashboard-action-inbox"),
      ]);

      if (ordersRes.ok) {
        setOrders(await ordersRes.json());
      }

      if (kpiRes.ok) {
        setKpiData(await kpiRes.json());
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

  const orderOperationsData = useMemo(
    () =>
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber || `#${order.id.slice(0, 8)}`,
        customerName: order.user?.name || "Bilinmeyen Müşteri",
        total: order.total || 0,
        status: order.status as "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED",
        createdAt: order.createdAt?.toString() || new Date().toISOString(),
        itemCount: order.items?.length || 0,
      })),
    [orders]
  );

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

  const soldOutCount = actionInbox.find((item) => item.type === "out_of_stock")?.count ?? 0;
  const criticalCount = kpiData?.criticalStock.count ?? 0;
  const todayText = format(new Date(), "d MMMM yyyy", { locale: tr });

  return (
    <div className="min-h-screen bg-[#f6f7f9] p-4 md:p-6 space-y-5">
      <div className="rounded-2xl border border-[#e9ebef] bg-white px-5 py-4">
        <h1 className="text-[22px] font-semibold text-[#202736]">Genel Bakış</h1>
        <p className="text-sm text-[#7e8797]">Bugün, {todayText}</p>
      </div>

      {kpiData ? (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => router.push("/admin-stock")}
          className="w-full rounded-2xl border border-[#ffd4d8] bg-[#fff5f6] px-5 py-4 text-left hover:bg-[#ffeff1] transition-colors"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#ffe6e9] p-2">
                <AlertTriangle className="h-4 w-4 text-[#e54c5f]" />
              </div>
              <div>
                <p className="text-[20px] leading-none font-semibold text-[#1f2431]">{soldOutCount} ürün tamamen tükendi</p>
                <p className="mt-1 text-sm text-[#7a8393]">Satışa kapalı ürünler müşteri kaybına yol açabilir.</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#c8cdd7]" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin-stock")}
          className="w-full rounded-2xl border border-[#ffe3ad] bg-[#fffbea] px-5 py-4 text-left hover:bg-[#fff7de] transition-colors"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#fff2cf] p-2">
                <AlertTriangle className="h-4 w-4 text-[#d19a00]" />
              </div>
              <div>
                <p className="text-[20px] leading-none font-semibold text-[#1f2431]">{criticalCount} ürün kritik stok seviyesinde</p>
                <p className="mt-1 text-sm text-[#7a8393]">Bu ürünler 2-3 gün içinde tükenebilir.</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#c8cdd7]" />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          {loading ? (
            <Card className="border border-[#e9ebef] bg-white shadow-sm">
              <CardContent className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : (
            <OrderOperations orders={orderOperationsData} onStatusChange={handleOrderStatusChange} />
          )}
        </div>

        <div>
          {loading ? (
            <Card className="border border-[#e9ebef] bg-white shadow-sm">
              <CardContent className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : (
            <ActionInbox items={actionInbox} />
          )}
        </div>
      </div>
    </div>
  );
}
