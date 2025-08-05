"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Notification = {
  id: string;
  message: string;
  createdAt: string;
};

export default function NotificationList() {
  const [logs, setLogs] = useState<Notification[]>([]);

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((res) => res.json())
      .then(setLogs);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bildirimler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="border p-3 rounded-md text-sm flex justify-between"
          >
            <span>{log.message}</span>
            <span className="text-muted-foreground text-xs">
              {new Date(log.createdAt).toLocaleString("tr-TR")}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
