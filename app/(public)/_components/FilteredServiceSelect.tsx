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
  petTags: string[]; // isimler (ör. "Kedi", "Köpek")
};

interface Props {
  allServices: Service[];
  speciesList: { id: string; name: string }[];
  selectedBySpecies: Record<string, string[]>;
  setSelectedBySpecies: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  counts: Record<string, number>; // Bu türden kaç owned pet seçilmiş
}

// küçük yardımcı: diziyi id'ye göre tekilleştir
function uniqueById<T extends { id: string }>(arr: T[]) {
  const seen = new Set<string>();
  return arr.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function FilteredServiceSelect({
  allServices,
  speciesList,
  selectedBySpecies,
  setSelectedBySpecies,
  counts,
}: Props) {
  // her tür bloğu için ayrı scroll ref tut
  const listRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scroll = (speciesId: string, dir: "left" | "right") => {
    const el = listRefs.current[speciesId];
    if (!el) return;
    const amount = el.offsetWidth * 0.8;
    el.scrollBy({
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

  // Tekilleştirilmiş tür listesi
  const uniqueSpecies = uniqueById(speciesList);

  // Tür bazlı hizmet listesi: petTags ile eşleşme
  const bySpecies = uniqueSpecies.reduce<Record<string, Service[]>>(
    (acc, sp) => {
      const upper = sp.name.trim().toUpperCase();
      acc[sp.id] = allServices.filter((s) =>
        s.petTags.some((t) => (t || "").trim().toUpperCase() === upper)
      );
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-16">
      {uniqueSpecies.map((sp) => {
        const services = bySpecies[sp.id] || [];
        const selectedForThis = selectedBySpecies[sp.id] || [];

        if (services.length === 0) return null;

        return (
          <div key={sp.id} className="relative">
            <h2 className="text-xl font-semibold mb-4">
              {sp.name} için Hizmetler
            </h2>

            {/* Sol ok */}
            <Button
              type="button"
              size="icon"
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 rounded-full bg-white text-black shadow-lg border hover:bg-gray-100"
              onClick={() => scroll(sp.id, "left")}
              aria-label="Sola kaydır"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Sağ ok */}
            <Button
              type="button"
              size="icon"
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 rounded-full bg-white text-black shadow-lg border hover:bg-gray-100"
              onClick={() => scroll(sp.id, "right")}
              aria-label="Sağa kaydır"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            <div
              ref={(el) => {
                listRefs.current[sp.id] = el;
              }}
              className="flex overflow-x-auto gap-6 px-1"
              style={{
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* scrollbar gizle */}
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
                      <div className="font-semibold text-sm">
                        {service.name}
                      </div>
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
