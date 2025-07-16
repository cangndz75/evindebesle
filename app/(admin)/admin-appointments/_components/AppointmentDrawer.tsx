"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export default function AppointmentDrawer({
  appointment,
}: {
  appointment: AppointmentWithRelations;
}) {
  const [status, setStatus] = useState(appointment.status);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    console.log({ status, selectedServices, note });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {appointment.user.name} - {appointment.ownedPet.name}
        </h2>
        <p className="text-muted-foreground text-sm">
          {format(new Date(appointment.confirmedAt), "d MMMM yyyy, HH:mm", {
            locale: tr,
          })}
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Durum</Label>
        <Select value={status} onValueChange={(val) => setStatus(val)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SCHEDULED">Planned</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Yapılan Hizmetler</Label>
        <div className="space-y-1">
          {appointment.services.map((s) => (
            <div key={s.service.id} className="flex items-center space-x-2">
              <Checkbox
                id={s.service.id}
                checked={selectedServices.includes(s.service.id)}
                onCheckedChange={() => toggleService(s.service.id)}
              />
              <label htmlFor={s.service.id} className="text-sm">
                {s.service.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Admin Notu</Label>
        <Textarea
          placeholder="Hizmet ile ilgili notunuzu yazın..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Medya Yükle (Yakında)</Label>
        <Input disabled placeholder="Medya yükleme özelliği eklenecek..." />
      </div>

      <Button onClick={handleSave} className="w-full mt-4">
        Kaydet / Güncelle
      </Button>
    </div>
  );
}

type AppointmentWithRelations = {
  id: string;
  confirmedAt: string;
  status: string;
  user: { name: string | null };
  ownedPet: { name: string };
  services: {
    service: {
      id: string;
      name: string;
    };
  }[];
};
