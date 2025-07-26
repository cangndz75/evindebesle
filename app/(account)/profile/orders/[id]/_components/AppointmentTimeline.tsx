"use client";

import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import clsx from "clsx";

type TimelineItem = {
  time: string | Date;
  title: string;
  description: string;
  status?: "Completed";
};

type Props = {
  timeline: TimelineItem[];
};

export default function AppointmentTimeline({ timeline }: Props) {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold">Zaman Çizelgesi</h3>
      <p className="text-sm text-muted-foreground">
        Tamamlanan hizmetlerin zaman sırasına göre listesi aşağıdadır.
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

              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {item.title} |{" "}
                  {format(new Date(item.time), "HH:mm", { locale: tr })}
                </p>

                <Badge className="text-xs py-0.5 px-2 rounded-full bg-black text-white">
                  Tamamlandı
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
