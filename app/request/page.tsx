"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, MinusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import DistrictSelect from "./_components/DistrictSelect";
import ServiceMultiSelect from "./_components/ServiceMultiSelect";

type Pet = { id: string; name: string };

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedPetIds = searchParams.getAll("pet");
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [district, setDistrict] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/pets")
      .then((res) => res.json())
      .then((data) => {
        setAllPets(data);
        const initialCounts = Object.fromEntries(
          selectedPetIds.map((id) => [id, 0])
        );
        setCounts(initialCounts);
      });
  }, []);

  const handleChange = (petId: string, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [petId]: Math.max(0, (prev[petId] || 0) + delta),
    }));
  };

  const handleSubmit = () => {
    const params = new URLSearchParams();
    Object.entries(counts).forEach(([id, count]) => {
      if (count > 0) params.append(id, count.toString());
    });
    if (district) params.set("district", district);
    services.forEach((s) => params.append("service", s));
    router.push(`/request/step2?${params.toString()}`);
  };

  const selectedPets = allPets.filter((p) => selectedPetIds.includes(p.id));

  return (
    <div className="h-screen grid md:grid-cols-2 overflow-hidden">
      <div className="flex flex-col justify-between px-8 py-10">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">
              Kaç tane hayvan için hizmet istiyorsunuz?
            </h1>
            <p className="text-muted-foreground text-sm">
              Her tür için sayı belirleyin
            </p>
          </div>

          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-2 px-1 hide-scrollbar">
              {selectedPets.map((pet) => (
                <div
                  key={pet.id}
                  className="min-w-[120px] max-w-[140px] flex-shrink-0 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md flex flex-col items-center"
                >
                  <Image
                    src={`/icons/${pet.name.toLowerCase()}.svg`}
                    alt={pet.name}
                    width={32}
                    height={32}
                    className="mb-2"
                  />
                  <div className="text-sm font-medium capitalize mb-2 text-center">
                    {pet.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleChange(pet.id, -1)}
                    >
                      <MinusIcon className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-semibold w-5 text-center">
                      {counts[pet.id]}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleChange(pet.id, 1)}
                    >
                      <PlusIcon className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow">
            <Label className="text-base font-semibold mb-2 block">
              İlçe Seçimi
            </Label>
            <DistrictSelect onSelect={setDistrict} />
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow">
            <Label className="text-base font-semibold mb-2 block">
              Hizmet Türleri
            </Label>
            <ServiceMultiSelect selected={services} setSelected={setServices} />
          </div>
        </div>

        <div className="text-right pt-6">
          <Button
            size="lg"
            onClick={handleSubmit}
            className="px-8 py-5 rounded-full text-base font-semibold"
          >
            Devam Et
          </Button>
        </div>
      </div>

      <div className="relative hidden md:flex items-center justify-center bg-gray-50">
        <Image
          src="https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0"
          alt="Dog"
          fill
          className="object-cover"
        />
        <div className="absolute bottom-6 left-6 bg-white/90 rounded-lg p-4 shadow-md max-w-sm">
          <p className="text-sm text-gray-700 italic">
            “Evde hayvan bakımı çok daha konforlu. Hizmet mükemmeldi.”
          </p>
          <p className="mt-2 font-semibold">Can · Türkiye</p>
        </div>
      </div>
    </div>
  );
}
