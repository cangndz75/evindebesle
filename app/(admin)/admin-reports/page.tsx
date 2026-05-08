"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { TrendingUp, DollarSign, Package, Percent, CalendarDays, Sparkles, BarChart3 } from "lucide-react";

type ReportData = {
  revenue: Array<{ date: string; revenue: number }>;
  orders: Array<{ date: string; orders: number }>;
  categories: Array<{ name: string; revenue: number; orders: number }>;
  products: Array<{ name: string; revenue: number; orders: number }>;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    returnRate: number;
  };
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30days");

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?range=${dateRange}`);
      if (res.ok) {
        const reportData = await res.json();
        setData(reportData);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
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

  const formatCompactDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
    }).format(date);
  };

  const hasRevenueData = (data?.revenue?.length || 0) > 0;
  const hasOrdersData = (data?.orders?.length || 0) > 0;
  const hasCategoriesData = (data?.categories?.length || 0) > 0;
  const hasProductsData = (data?.products?.length || 0) > 0;

  const summaryCards = data
    ? [
        {
          title: "Toplam Gelir",
          value: formatPrice(data.summary.totalRevenue),
          icon: DollarSign,
          tone: "from-emerald-50 to-emerald-100/40",
          chip: "Ciro",
        },
        {
          title: "Toplam Sipariş",
          value: data.summary.totalOrders.toLocaleString("tr-TR"),
          icon: Package,
          tone: "from-blue-50 to-blue-100/40",
          chip: "Adet",
        },
        {
          title: "Ortalama Sepet",
          value: formatPrice(data.summary.averageOrderValue),
          icon: TrendingUp,
          tone: "from-amber-50 to-orange-100/40",
          chip: "AOV",
        },
        {
          title: "Iade Orani",
          value: `${data.summary.returnRate.toFixed(1)}%`,
          icon: Percent,
          tone: "from-fuchsia-50 to-pink-100/40",
          chip: "Kalite",
        },
      ]
    : [];

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 bg-gray-50 min-h-full">
      <Card className="overflow-hidden border-gray-200 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                <Sparkles className="h-3.5 w-3.5" />
                Canli Performans Merkezi
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">Raporlama Paneli</h1>
              <p className="mt-1 text-sm text-slate-300">Gelir, sipariş ve kategori performansını tek bakışta takip edin.</p>
            </div>

            <div className="w-full md:w-auto">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full md:w-56 border-white/20 bg-white/10 text-white [&_svg]:text-white">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Son 7 Gun</SelectItem>
                  <SelectItem value="30days">Son 30 Gun</SelectItem>
                  <SelectItem value="90days">Son 90 Gun</SelectItem>
                  <SelectItem value="1year">Son 1 Yil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className={`border-gray-200 bg-linear-to-br ${card.tone}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-white/80 p-2.5 shadow-xs ring-1 ring-gray-200/70">
                      <Icon className="h-4 w-4 text-slate-700" />
                    </div>
                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-gray-200">
                      {card.chip}
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-medium text-slate-600">{card.title}</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{card.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-gray-200">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Gelir Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full rounded-xl" />
            ) : hasRevenueData ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data?.revenue || []} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={formatCompactDate} tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => formatPrice(value)}
                    labelFormatter={(value) => `Tarih: ${formatCompactDate(String(value))}`}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                Seçili aralık için gelir verisi bulunamadı.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Sipariş Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full rounded-xl" />
            ) : hasOrdersData ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data?.orders || []} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={formatCompactDate} tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => `${value} siparis`}
                    labelFormatter={(value) => `Tarih: ${formatCompactDate(String(value))}`}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                Seçili aralık için sipariş verisi bulunamadı.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Kategori Kirilimi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-80 w-full rounded-xl" />
          ) : hasCategoriesData ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={data?.categories || []}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={112}
                      paddingAngle={3}
                    >
                      {(data?.categories || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatPrice(value)} contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {(data?.categories || []).map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <div>
                        <p className="font-medium text-slate-800">{category.name}</p>
                        <p className="text-xs text-slate-500">{category.orders} siparis</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatPrice(category.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
              Kategori verisi bulunamadı.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>En Cok Satan Urunler</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-80 w-full rounded-xl" />
          ) : hasProductsData ? (
            <div className="space-y-3">
              {(data?.products || []).slice(0, 10).map((product, index) => {
                const maxRevenue = data?.products?.[0]?.revenue || 1;
                const width = Math.max(8, Math.round((product.revenue / maxRevenue) * 100));

                return (
                  <div key={product.name} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {index + 1}
                        </span>
                        <span className="truncate font-medium text-slate-800">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatPrice(product.revenue)}</p>
                        <p className="text-xs text-slate-500">{product.orders} siparis</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-linear-to-r from-indigo-500 to-blue-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
              Urun verisi bulunamadı.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
