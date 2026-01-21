"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

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
}

export default function BusinessSnapshot({
  revenue,
  orders,
  aov,
  chartData,
}: BusinessSnapshotProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const kpis = [
    {
      label: "Toplam Gelir",
      value: formatPrice(revenue.total),
      change: revenue.change,
      trend: revenue.change >= 0 ? "up" : "down",
    },
    {
      label: "Sipariş Sayısı",
      value: `${orders.count}`,
      change: orders.change,
      trend: orders.change >= 0 ? "up" : "down",
    },
    {
      label: "Ortalama Sepet",
      value: formatPrice(aov.today),
      change: aov.change,
      trend: aov.change >= 0 ? "up" : "down",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => (
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
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="text-xl font-semibold text-gray-900">Gelir Trendi</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={60}
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
        </CardContent>
      </Card>
    </div>
  );
}
