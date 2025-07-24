"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type AppointmentWithRelations = {
  id: string;
  confirmedAt: string;
  status: string;
  user?: {
    name: string | null;
  } | null;
  pets: {
    ownedPet?: {
      name: string | null;
    } | null;
  }[];
  services: {
    service: {
      id: string;
      name: string;
    };
  }[];
};

export default function AppointmentRow({
  appointment,
}: {
  appointment: AppointmentWithRelations;
}) {
  return (
    <tr className="border-b hover:bg-muted/50 transition">
      <td className="px-4 py-3 font-medium">{appointment.user?.name || "-"}</td>
      <td className="px-4 py-3">
        {appointment.pets
          .map((p) => p.ownedPet?.name)
          .filter((n): n is string => !!n)
          .join(", ") || "Evcil Hayvan Yok"}
      </td>
      <td className="px-4 py-3">
        {format(new Date(appointment.confirmedAt), "d MMMM yyyy", {
          locale: tr,
        })}
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline">{appointment.status}</Badge>
      </td>
      <td className="px-4 py-3">
        {appointment.services.map((s) => s.service.name).join(", ")}
      </td>
      <td className="px-4 py-3 text-right">
        <Link href={`/admin-appointments/${appointment.id}`}>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </Link>
      </td>
    </tr>
  );
}
