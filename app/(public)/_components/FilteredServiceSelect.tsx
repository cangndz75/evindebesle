"use client";

import Image from "next/image";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  petTags: string[]; // isimler
};

interface Props {
  allServices: Service[];
  speciesList: { id: string; name: string }[];
  // ✅ tür bazlı seçim
  selectedBySpecies: Record<string, string[]>;
  setSelectedBySpecies: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  // UI kontrolu: bu türden kaç owned pet seçilmiş
  counts: Record<string, number>;
}

export default function FilteredServiceSelect({
  allServices,
  speciesList,
  selectedBySpecies,
  setSelectedBySpecies,
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

  const toggle = (serviceId: string, speciesId: string) => {
    const petCount = counts[speciesId] ?? 0;
    if (petCount < 1) {
      return toast.error("Önce bu türden en az 1 evcil hayvan seçin.");
    }
    setSelectedBySpecies((prev) => {
      const cur = prev[speciesId] || [];
      const next = cur.includes(serviceId)
        ? cur.filter((id) => id !== serviceId)
        : [...cur, serviceId];
      return { ...prev, [speciesId]: next };
    });
  };

  // Tür bazlı grupla: servis.petTags (isim) == species.name
  const bySpecies = speciesList.reduce<Record<string, Service[]>>((acc, sp) => {
    const upper = sp.name.toUpperCase();
    acc[sp.id] = allServices.filter((s) =>
      s.petTags.some((t) => (t || "").toUpperCase() === upper)
    );
    return acc;
  }, {});

  return (
    <div className="space-y-16">
      {speciesList.map((sp) => {
        const services = bySpecies[sp.id] || [];
        const selectedForThis = selectedBySpecies[sp.id] || [];

        return (
          <div key={sp.id} className="relative">
            <h2 className="text-xl font-semibold mb-4">
              {sp.name} için Hizmetler
            </h2>

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

              {services.map((service) => {
                const isSelected = selectedForThis.includes(service.id);
                return (
                  <div
                    key={service.id}
                    className={cn(
                      "flex-shrink-0 w-[250px] rounded-xl border shadow-sm hover:shadow-md transition scroll-snap-align-start bg-white",
                      isSelected && "ring-2 ring-primary"
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
                          variant={isSelected ? "secondary" : "outline"}
                          onClick={() => toggle(service.id, sp.id)}
                        >
                          {isSelected ? "Seçildi" : "Seç"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
