"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, MinusIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import Stepper from "@/app/(public)/_components/Stepper";
import DistrictSelect from "../_components/DistrictSelect";
import { toast } from "sonner";
import FilteredServiceSelect from "@/app/(public)/_components/FilteredServiceSelect";
import NewAddressModal from "../_components/NewAddressModal";

type Pet = {
  id: string;
  name: string;
  image: string;
  species: string;
};

type Service = {
  id: string;
  name: string;
  price: number;
  petTags: string[];
};

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedPetIds = useMemo(
    () => searchParams.getAll("pet"),
    [searchParams]
  );

  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>(
    searchParams.getAll("service")
  );
  const [fullAddress, setFullAddress] = useState<string>("");
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((user) => {
        if (user.fullAddress) {
          const addr = {
            id: "me",
            districtId: user.districtId,
            fullAddress: user.fullAddress,
          };
          setAddresses([addr]);
          setSelectedAddressId("me");
          setDistrictId(user.districtId);
          setFullAddress(user.fullAddress);
        } else {
          setAddresses([]);
        }
      });
  }, []);

  useEffect(() => {
    setIsLoadingPets(true);
    fetch("/api/pets")
      .then((res) => res.json())
      .then((data) => {
        setAllPets(data);
        const initialCounts = Object.fromEntries(
          selectedPetIds.map((id) => [id, 0])
        );
        setCounts(initialCounts);
      })
      .finally(() => setIsLoadingPets(false));
  }, []);

  useEffect(() => {
    if (selectedPetIds.length === 0) return;
    setIsLoadingServices(true);
    const query = new URLSearchParams();
    selectedPetIds.forEach((id) => query.append("pet", id));
    fetch(`/api/services/filtered?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => setAllServices(data))
      .finally(() => setIsLoadingServices(false));
  }, [selectedPetIds]);

  const handleChange = (petId: string, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [petId]: Math.max(0, (prev[petId] || 0) + delta),
    }));
  };

  const handleSubmit = () => {
    const totalCount = Object.values(counts).reduce(
      (sum, count) => sum + count,
      0
    );
    if (totalCount === 0)
      return toast.error("Lütfen en az 1 hayvan için sayı belirtin.");
    if (!districtId) return toast.error("Lütfen ilçe seçin.");
    if (!fullAddress.trim()) return toast.error("Lütfen detaylı adres girin.");
    if (services.length === 0)
      return toast.error("En az 1 hizmet seçmelisiniz.");

    const params = new URLSearchParams();
    Object.entries(counts).forEach(([id, count]) => {
      if (count > 0) params.append("pet", id);
      params.append(id, count.toString());
    });
    params.set("district", districtId);
    params.set("fullAddress", fullAddress);
    services.forEach((s) => params.append("service", s));

    router.push(`/request/step2?${params.toString()}`);
  };

  const selectedPets = allPets.filter((p) => selectedPetIds.includes(p.id));
  const selectedSpecies = selectedPets.map((p) => p.species);

  return (
    <div className="h-screen grid md:grid-cols-2 overflow-hidden relative">
      <div className="flex flex-col justify-between px-6 py-6 overflow-hidden">
        <div className="sticky top-0 z-40 bg-white pb-2 md:static">
          <Stepper activeStep={1} />
        </div>

        <div className="space-y-4 overflow-y-auto pr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground"
          >
            ← Geri
          </Button>

          <div className="pl-4 md:pl-8">
            <h1 className="text-2xl font-bold">
              Kaç hayvan için hizmet istiyorsunuz?
            </h1>
            <p className="text-muted-foreground text-sm">
              Her tür için sayı belirtin
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {isLoadingPets
              ? [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="min-w-[130px] h-[120px] flex-shrink-0 rounded-xl border bg-muted animate-pulse p-4 shadow-sm"
                  />
                ))
              : selectedPets.map((pet) => (
                  <div
                    key={pet.id}
                    className="min-w-[130px] flex-shrink-0 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md flex flex-col items-center"
                  >
                    <div className="text-sm font-medium capitalize mb-3 text-center">
                      {pet.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChange(pet.id, -1)}
                      >
                        <MinusIcon className="w-5 h-5" />
                      </Button>
                      <span className="text-lg font-semibold w-8 text-center select-none">
                        {counts[pet.id]}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChange(pet.id, 1)}
                      >
                        <PlusIcon className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Adresim</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/profile/addresses")}
              >
                Adreslerim
              </Button>
            </div>
            {addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Kayıtlı adresiniz yok.
              </p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <input
                      type="radio"
                      name="selectedAddress"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => {
                        setSelectedAddressId(addr.id);
                        setDistrictId(addr.districtId);
                        setFullAddress(addr.fullAddress);
                      }}
                    />
                    <span>{addr.fullAddress}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow">
            <Label className="text-sm font-semibold mb-1 block">
              Hizmet Türleri
            </Label>
            {isLoadingServices ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-full bg-muted animate-pulse rounded-md"
                  />
                ))}
              </div>
            ) : allServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Uygun hizmet bulunamadı.
              </p>
            ) : (
              <FilteredServiceSelect
                allServices={allServices}
                selectedPetSpecies={selectedSpecies}
                selected={services}
                setSelected={setServices}
              />
            )}
          </div>
        </div>

        <div className="pt-4 text-right">
          <Button
            size="lg"
            onClick={handleSubmit}
            className="w-full md:w-auto px-8 py-4 rounded-full text-base font-semibold"
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
