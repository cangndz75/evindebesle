"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type CheckItem = {
  id: string;
  serviceId: string;
  title: string;
  isChecked: boolean;
  note?: string | null;
};

type Props = {
  appointmentId: string;
  petId: string;
  services: { id: string; name: string }[];
};

export default function AppointmentCheckSection({
  appointmentId,
  petId,
  services,
}: Props) {
  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(
          `/api/admin/appointments/${appointmentId}/check-items`
        );
        const json = await res.json();
        if (json.success) {
          setCheckItems(json.data);
        } else {
          toast.error("Check listeleri alınamadı.");
        }
      } catch (err) {
        console.error("Check item fetch hatası:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [appointmentId]);

  const handleToggle = (serviceId: string) => {
    setCheckItems((prev) =>
      prev.map((item) =>
        item.serviceId === serviceId
          ? { ...item, isChecked: !item.isChecked }
          : item
      )
    );
  };

  const handleNoteChange = (serviceId: string, value: string) => {
    setCheckItems((prev) =>
      prev.map((item) =>
        item.serviceId === serviceId ? { ...item, note: value } : item
      )
    );
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-sm font-semibold">Tamamlanan Hizmetler</h3>
      <Separator />

      {services.map((service) => {
        const existing = checkItems.find((c) => c.serviceId === service.id);
        const isChecked = existing?.isChecked ?? false;
        const note = existing?.note ?? "";

        return (
          <div
            key={service.id}
            className="flex flex-col gap-2 p-3 border rounded-md bg-muted/40"
          >
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => handleToggle(service.id)}
              />
              {service.name}
            </Label>

            <Input
              placeholder="Not (isteğe bağlı)"
              value={note}
              onChange={(e) => handleNoteChange(service.id, e.target.value)}
              className="text-sm"
            />
          </div>
        );
      })}
    </div>
  );
}
