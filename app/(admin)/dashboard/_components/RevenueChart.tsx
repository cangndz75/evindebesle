"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RevenueChart() {
  const [data, setData] = useState<{ date: string; revenue: number }[]>([]);

  useEffect(() => {
    fetch("/api/admin/revenue-stats")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <Card className="border border-gray-200">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl">Gelir Grafiği</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip 
              contentStyle={{ 
                fontSize: '12px',
                padding: '8px',
                borderRadius: '6px'
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
