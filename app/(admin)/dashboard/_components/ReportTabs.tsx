"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppointmentStatusChart from "./AppointmentStatusChart";

export default function ReportTabs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>İstatistiksel Raporlar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AppointmentStatusChart />
        {/* Diğer grafik bileşenleri de eklenebilir */}
      </CardContent>
    </Card>
  );
}
