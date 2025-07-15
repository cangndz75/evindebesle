"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
};

export default function ServiceMultiSelect({
  selected,
  setSelected,
}: {
  selected: string[];
  setSelected: (val: string[]) => void;
}) {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetch("/api/admin-services")
      .then((res) => res.json())
      .then(setServices)
      .catch(() => setServices([]));
  }, []);

  const toggle = (serviceId: string) => {
    setSelected(
      selected.includes(serviceId)
        ? selected.filter((id) => id !== serviceId)
        : [...selected, serviceId]
    );
  };

  return (
    <div className="grid gap-2 max-h-64 overflow-y-auto">
      {services.map((service) => (
        <div key={service.id} className="flex items-center gap-2">
          <Checkbox
            id={service.id}
            checked={selected.includes(service.id)}
            onCheckedChange={() => toggle(service.id)}
          />
          <Label htmlFor={service.id}>{service.name}</Label>
        </div>
      ))}
    </div>
  );
}
