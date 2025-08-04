"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string; // Eğer varsa
  petTags: string[];
};

interface Props {
  allServices: Service[];
  selectedPetSpecies: string[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  counts: Record<string, number>;
}

export default function FilteredServiceSelect({
  allServices,
  selectedPetSpecies,
  selected,
  setSelected,
  counts,
}: Props) {
  const toggle = (service: Service, species: string) => {
    const count = counts[species] ?? 0;
    if (count < 1) {
      toast.error(`Lütfen önce ${species} için en az 1 hayvan seçin.`);
      return;
    }

    if (selected.includes(service.id)) {
      setSelected(selected.filter((s) => s !== service.id));
    } else {
      setSelected([...selected, service.id]);
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
    <ScrollArea className="max-h-[500px] pr-2">
      <div className="space-y-8">
        {Object.entries(groupedBySpecies).map(([species, services]) => (
          <div key={species}>
            <h3 className="text-lg font-semibold mb-4">
              {species} için Hizmetler
            </h3>
            {services.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">
                Bu türe özel hizmet bulunamadı.
              </div>
            ) : (
              <div
                className={cn(
                  "flex gap-4 overflow-x-auto scrollbar-hide",
                  "sm:grid sm:grid-cols-2 md:grid-cols-3"
                )}
              >
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={cn(
                      "border rounded-xl overflow-hidden bg-white shadow transition hover:shadow-md",
                      selected.includes(service.id) && "ring-2 ring-primary"
                    )}
                  >
                    <div className="relative w-full h-36 bg-muted">
                      <Image
                        src={
                          service.imageUrl ||
                          "https://images.unsplash.com/photo-1579452113472-2f2a764188ac?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        }
                        alt={service.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="font-bold text-sm">{service.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {service.description || "Açıklama bulunmuyor"}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-base font-semibold text-orange-600">
                          {service.price}₺
                        </span>
                        <Button
                          size="sm"
                          variant={
                            selected.includes(service.id)
                              ? "secondary"
                              : "outline"
                          }
                          onClick={() => toggle(service, species)}
                        >
                          {selected.includes(service.id) ? "Seçildi" : "Seç"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
