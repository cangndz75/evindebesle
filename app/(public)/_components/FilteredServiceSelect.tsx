"use client";

import Image from "next/image";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Service = {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const toggle = (service: Service, species: string) => {
    const count = counts[species] ?? 0;
    if (count < 1) {
      toast.error(`Lütfen önce ${species} için en az 1 hayvan seçin.`);
      return;
    }

    if (selected.includes(service.id)) {
      setSelected(selected.filter((id) => id !== service.id));
    } else {
      setSelected([...selected, service.id]);
    }
  };

  const groupedBySpecies = selectedPetSpecies.reduce(
    (acc, species) => {
      const upper = species.toUpperCase();
      acc[species] = allServices.filter((s) =>
        s.petTags.map((t) => t.toUpperCase()).includes(upper)
      );
      return acc;
    },
    {} as Record<string, Service[]>
  );

  return (
    <div className="space-y-16">
      {Object.entries(groupedBySpecies).map(([species, services]) => (
        <div key={species} className="relative">
          <h2 className="text-xl font-semibold mb-4">
            {species} için Hizmetler
          </h2>

          {/* Scroll buttons */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute left-0 top-[45%] z-10 hidden md:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-0 top-[45%] z-10 hidden md:flex"
            onClick={() => scroll("right")}
          >
            <ChevronRight />
          </Button>

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-6 px-1"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {services.map((service) => (
              <div
                key={service.id}
                className={cn(
                  "flex-shrink-0 w-[250px] rounded-xl border shadow-sm hover:shadow-md transition scroll-snap-align-start bg-white",
                  selected.includes(service.id) && "ring-2 ring-primary"
                )}
              >
                <div className="relative h-40 w-full rounded-t-xl overflow-hidden">
                  <Image
                    src={
                      service.imageUrl ||
                      "https://images.unsplash.com/photo-1579452113472-2f2a764188ac?q=80&w=1170"
                    }
                    alt={service.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 space-y-1">
                  <div className="font-semibold text-sm">{service.name}</div>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {service.description || "Açıklama bulunmuyor"}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-orange-600 font-semibold text-base">
                      {service.price}₺
                    </span>
                    <Button
                      size="sm"
                      variant={
                        selected.includes(service.id) ? "secondary" : "outline"
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
        </div>
      ))}
    </div>
  );
}
