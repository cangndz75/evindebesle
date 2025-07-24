"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Props = {
  serviceList: {
    id: string;
    name: string;
  }[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

export default function AppointmentChecklistForm({
  serviceList,
  selected,
  onChange,
}: Props) {
  const toggleService = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {serviceList.map((service) => (
        <div
          key={service.id}
          className="flex items-center space-x-3 border rounded-md p-3 hover:bg-muted transition"
        >
          <Checkbox
            id={service.id}
            checked={selected.includes(service.id)}
            onCheckedChange={() => toggleService(service.id)}
          />
          <Label htmlFor={service.id} className="cursor-pointer">
            {service.name}
          </Label>
        </div>
      ))}
    </div>
  );
}
