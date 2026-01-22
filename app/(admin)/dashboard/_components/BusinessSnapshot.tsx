"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, ArrowRight, ExternalLink, Package } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface BusinessSnapshotProps {
  revenue: {
    total: number;
    change: number;
    previousTotal: number;
  };
  orders: {
    count: number;
    change: number;
  };
  aov: {
    today: number;
    change: number;
  };
  chartData: Array<{ date: string; revenue: number }>;
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    total: number;
    createdAt: string;
    user: { name: string };
  }>;
  recentProducts?: Array<{
    id: string;
    name: string;
    image: string | null;
    price: number;
    createdAt: string;
  }>;
  topProducts?: Array<{
    id: string;
    name: string;
    image: string | null;
    price: number;
    totalSold?: number;
  }>;
}

export default function BusinessSnapshot({
  revenue,
  orders,
  aov,
  chartData,
  recentOrders = [],
  recentProducts = [],
  topProducts = [],
}: BusinessSnapshotProps) {
  const router = useRouter();
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getContextText = (kpi: { label: string; value: string | number; change: number; trend: string }) => {
    if (kpi.label === "Toplam Gelir") {
      return revenue.total === 0 
        ? "7 günde 0 gelir" 
        : `7 günde ${formatPrice(revenue.previousTotal)} → ${formatPrice(revenue.total)}`;
    }
    if (kpi.label === "Sipariş Sayısı") {
      return orders.count === 0 
        ? "7 günde 0 sipariş" 
        : `${orders.count} sipariş bugün`;
    }
    if (kpi.label === "Ortalama Sepet") {
      return aov.today === 0 
        ? "Henüz sipariş yok" 
        : `Ortalama ${formatPrice(aov.today)}`;
    }
    return "";
  };

  const getCTAHref = (label: string) => {
    if (label === "Toplam Gelir") return "/admin-reports";
    if (label === "Sipariş Sayısı") return "/admin-orders";
    if (label === "Ortalama Sepet") return "/admin-orders";
    return "#";
  };

  const kpis = [
    {
      label: "Toplam Gelir",
      value: formatPrice(revenue.total),
      change: revenue.change,
      trend: revenue.change >= 0 ? "up" : "down",
      context: getContextText({ label: "Toplam Gelir", value: "", change: 0, trend: "up" }),
      href: getCTAHref("Toplam Gelir"),
    },
    {
      label: "Sipariş Sayısı",
      value: `${orders.count}`,
      change: orders.change,
      trend: orders.change >= 0 ? "up" : "down",
      context: getContextText({ label: "Sipariş Sayısı", value: "", change: 0, trend: "up" }),
      href: getCTAHref("Sipariş Sayısı"),
    },
    {
      label: "Ortalama Sepet",
      value: formatPrice(aov.today),
      change: aov.change,
      trend: aov.change >= 0 ? "up" : "down",
      context: getContextText({ label: "Ortalama Sepet", value: "", change: 0, trend: "up" }),
      href: getCTAHref("Ortalama Sepet"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50/50 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="relative">
              <p className="text-xs font-medium text-gray-500 mb-2">{kpi.label}</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                {kpi.change !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    kpi.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}>
                    {kpi.trend === "up" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{Math.abs(kpi.change).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">{kpi.context}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(kpi.href)}
                className="text-xs h-7 px-2 hover:bg-gray-100"
              >
                Detaya git
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart + Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol: Gelir Trendi (Küçük) */}
        <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Gelir Trendi</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {chartData.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-center">
                <p className="text-sm text-gray-500 mb-4">Henüz veri yok</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin-products")}
                  className="text-xs"
                >
                  İlk ürünü ekle
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                    formatter={(value: number) => formatPrice(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sağ: Listeler */}
        <div className="space-y-6">
          {/* Son Siparişler */}
          <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Son Siparişler</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/admin-orders")}
                  className="text-xs h-7 px-2"
                >
                  Tümü
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500 mb-3">Henüz sipariş yok</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin-products")}
                    className="text-xs"
                  >
                    Ürün ekle
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.user.name} • {format(new Date(order.createdAt), "d MMM", { locale: tr })}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 ml-4">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* En Çok Satanlar / Son Ürünler */}
          <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {topProducts.length > 0 ? "En Çok Satanlar" : "Son Ürünler"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/admin-products")}
                  className="text-xs h-7 px-2"
                >
                  Tümü
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentProducts.length === 0 && topProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500 mb-3">Henüz ürün yok</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin-products")}
                    className="text-xs"
                  >
                    İlk ürünü ekle
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {(topProducts.length > 0 ? topProducts : recentProducts).slice(0, 5).map((product) => (
                    <div key={product.id} className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs font-semibold text-gray-900">
                              {formatPrice(product.price)}
                            </p>
                            {topProducts.length > 0 && "totalSold" in product && product.totalSold && (
                              <span className="text-xs text-gray-500">
                                • {product.totalSold} satış
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
