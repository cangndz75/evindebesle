"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { InfoIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Service = {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
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
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => setServices(data.filter((s: Service) => s.isActive)));
  }, []);

  const toggle = (serviceId: string) => {
    setSelected(
      selected.includes(serviceId)
        ? selected.filter((s) => s !== serviceId)
        : [...selected, serviceId]
    );
  };

  return (
    <TooltipProvider>
      <div className="grid gap-3">
        {services.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-4 border border-gray-200 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id={s.id}
                checked={selected.includes(s.id)}
                onCheckedChange={() => toggle(s.id)}
                className="mt-1"
              />
              <Label
                htmlFor={s.id}
                className="font-semibold text-gray-900 flex items-center gap-2 cursor-pointer select-none"
              >
                {s.name}
                <span className="inline-block bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-md">
                  {s.price.toLocaleString("tr-TR")}₺
                </span>
              </Label>
            </div>

            {s.description && (
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <InfoIcon className="w-5 h-5 text-gray-400 cursor-pointer hover:text-primary transition" />
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hizmet detayını gör</p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent className="max-w-xs text-sm text-gray-700 rounded-lg shadow-lg">
                  {s.description}
                </PopoverContent>
              </Popover>
            )}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
