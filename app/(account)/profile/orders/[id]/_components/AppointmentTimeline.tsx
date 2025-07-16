"use client";

import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import clsx from "clsx";

type TimelineItem = {
  time: string;
  title: string;
  description: string;
  status: "Pending" | "In Progress" | "Dispatched" | "Completed";
};

type Props = {
  timeline: TimelineItem[];
};

export default function AppointmentTimeline({ timeline }: Props) {
  const statusColorMap: Record<string, string> = {
    Pending: "bg-gray-100 text-gray-800",
    "In Progress": "bg-blue-100 text-blue-800",
    Dispatched: "bg-orange-100 text-orange-800",
    Completed: "bg-black text-white",
  };

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold">Zaman Çizelgesi</h3>
      <p className="text-sm text-muted-foreground">
        Randevunun zaman bazlı ilerleyişi aşağıda listelenmiştir.
      </p>

      <ol className="relative border-s border-gray-300 mt-6 space-y-8">
        {timeline.map((item, index) => {
          const isLast = index === timeline.length - 1;

          return (
            <li key={index} className="ms-4">
              <div
                className={clsx(
                  "absolute w-3 h-3 rounded-full -start-1.5 top-1.5",
                  isLast ? "bg-black" : "bg-gray-300"
                )}
              />

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-800 font-medium">
                  {format(new Date(item.time), "HH:mm", { locale: tr })}
                </span>
                <Badge
                  className={`text-xs py-0.5 px-2 rounded-full ${statusColorMap[item.status]}`}
                >
                  {item.status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
