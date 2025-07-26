"use client";

import { useEffect, useState } from "react";
import AppointmentTimeline from "./AppointmentTimeline";
import { Skeleton } from "@/components/ui/skeleton";

type Service = {
  serviceId: string;
  name: string;
  description: string;
  isCompleted: boolean;
  completedAt: string;
};

type TimelineItem = {
  time: string;
  title: string;
  description: string;
  status: "Completed";
};

export default function AppointmentTimelineWrapper({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/services`);
        const data = await res.json();

        if (data?.services) {
          const formatted = data.services
            .filter((s: Service) => s.isCompleted && s.completedAt)
            .sort(
              (a: Service, b: Service) =>
                new Date(a.completedAt).getTime() -
                new Date(b.completedAt).getTime()
            )
            .map((s: Service) => ({
              time: s.completedAt,
              title: s.name,
              description: s.description || s.name,
              status: "Completed",
            }));

          setTimeline(formatted);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-80" />
        <div className="space-y-6 mt-4">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <AppointmentTimeline timeline={timeline} />;
}
