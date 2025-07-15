"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

type Service = {
  id: string;
  name: string;
  price: number;
  description?: string;
  petTags: string[]; // Örn: ["KEDİ", "KÖPEK"]
};

interface Props {
  allServices: Service[];
  selectedPetSpecies: string[]; // Örn: ["KEDİ"]
  selected: string[];
  setSelected: (ids: string[]) => void;
}

export default function FilteredServiceSelect({
  allServices,
  selectedPetSpecies,
  selected,
  setSelected,
}: Props) {
  const filtered = allServices.filter((service) =>
    service.petTags.some((tag) =>
      selectedPetSpecies.map((s) => s.toUpperCase()).includes(tag.toUpperCase())
    )
  );

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <ScrollArea className="max-h-64 pr-2">
      <TooltipProvider>
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground italic">
              Bu hayvan türü için hizmet bulunamadı.
            </div>
          )}

          {filtered.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-accent transition"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selected.includes(service.id)}
                  onCheckedChange={() => toggle(service.id)}
                />
                <div>
                  <Label className="font-medium">{service.name}</Label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {service.petTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold bg-black text-white px-2 py-1 rounded">
                  {service.price}₺
                </span>

                {service.description && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm leading-snug">
                      {service.description}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
        </div>
      </TooltipProvider>
    </ScrollArea>
  );
}
