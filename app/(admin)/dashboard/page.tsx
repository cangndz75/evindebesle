"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCards from "./_components/StatCards";
import RevenueChart from "./_components/RevenueChart";
import LatestAppointmentsTable from "./_components/LatestAppointmentsTable";
import ReportTabs from "./_components/ReportTabs";
import NotificationList from "./_components/NotificationList";

export default function AdminDashboard() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return {
      start: format(today, "yyyy-MM-dd"),
      end: format(today, "yyyy-MM-dd"),
    };
  });

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Paneli</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-sm">
            <CalendarIcon className="mr-2 w-4 h-4" />
            {dateRange.start} - {dateRange.end}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <StatCards />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel</TabsTrigger>
          <TabsTrigger value="reports">Raporlar</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <RevenueChart />
          <LatestAppointmentsTable />
        </TabsContent>

        <TabsContent value="reports">
          <ReportTabs />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
