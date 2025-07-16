"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Info } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  price: number;
  description?: string;
  petTags: string[];
};

interface Props {
  allServices: Service[];
  selectedPetSpecies: string[];
  selected: string[];
  setSelected: (ids: string[]) => void;
}

export default function FilteredServiceSelect({
  allServices,
  selectedPetSpecies,
  selected,
  setSelected,
}: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const groupedBySpecies = selectedPetSpecies.reduce(
    (acc, species) => {
      const upperSpecies = species.toUpperCase();
      acc[species] = allServices.filter((s) =>
        s.petTags.map((t) => t.toUpperCase()).includes(upperSpecies)
      );
      return acc;
    },
    {} as Record<string, Service[]>
  );

  return (
    <ScrollArea className="max-h-64 pr-2">
      <TooltipProvider>
        <div className="space-y-6">
          {Object.entries(groupedBySpecies).map(([species, services]) => (
            <div key={species} className="space-y-2">
              <div className="text-md font-semibold capitalize underline">
                {species} için hizmetler
              </div>

              {services.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">
                  Bu tür için uygun hizmet bulunamadı.
                </div>
              ) : (
                services.map((service) => (
                  <div
                    key={`${species}-${service.id}`}
                    onClick={() => toggle(service.id)}
                    className={cn(
                      "flex items-center justify-between border rounded-lg px-4 py-3 transition cursor-pointer",
                      selected.includes(service.id)
                        ? "bg-accent border-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selected.includes(service.id)}
                        onCheckedChange={() => toggle(service.id)}
                        className="pointer-events-none"
                      />
                      <div>
                        <Label className="font-medium">{service.name}</Label>
                        {/* <div className="flex gap-1 mt-1 flex-wrap">
                          {service.petTags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full uppercase"
                            >
                              {tag}
                            </span>
                          ))}
                        </div> */}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold bg-black text-white px-2 py-1 rounded">
                        {service.price}₺
                      </span>

                      {service.description && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                          </PopoverTrigger>
                          <PopoverContent className="max-w-xs text-sm leading-snug">
                            {service.description}
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </TooltipProvider>
    </ScrollArea>
  );
}
