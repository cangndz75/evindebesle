"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, MinusIcon, InfoIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Stepper from "@/app/(public)/_components/Stepper";
import FilteredServiceSelect from "@/app/(public)/_components/FilteredServiceSelect";
import PetSelectModal from "../_components/PetSelectModal";
import { toast } from "sonner";

type Pet = { id: string; name: string; image: string; species: string };
type UserPet = {
  id: string;
  petName: string;
  userPetName: string;
  image: string | null;
  species: string;
};
type Service = { id: string; name: string; price: number; petTags: string[] };
type Address = {
  id: string;
  districtId: string;
  fullAddress: string;
  isPrimary: boolean;
};

export default function Step1Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedPetIds = useMemo(
    () => searchParams.getAll("pet") as string[],
    [searchParams]
  );

  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [userPets, setUserPets] = useState<UserPet[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [services, setServices] = useState<string[]>(
    searchParams.getAll("service") as string[]
  );

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [fullAddress, setFullAddress] = useState<string>("");

  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  const [modalSpecies, setModalSpecies] = useState<string | null>(null);
  const [selectedUserPets, setSelectedUserPets] = useState<
    Record<string, string[]>
  >({});

  const getSpeciesById = (id: string) =>
    allPets.find((p) => p.id === id)?.species;

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((u: any) => {
        if (u.fullAddress) {
          const me: Address = {
            id: "me",
            districtId: u.districtId,
            fullAddress: u.fullAddress,
            isPrimary: true,
          };
          setAddresses([me]);
          setSelectedAddressId(me.id);
          setDistrictId(me.districtId);
          setFullAddress(me.fullAddress);
        }
      });
  }, []);

  useEffect(() => {
    setIsLoadingPets(true);
    fetch("/api/pets")
      .then((r) => r.json())
      .then((data: Pet[]) => {
        setAllPets(data);
        const init: Record<string, number> = {};
        selectedPetIds.forEach((id) => (init[id] = 0));
        setCounts(init);
      })
      .finally(() => setIsLoadingPets(false));
  }, []);

  useEffect(() => {
    fetch("/api/user-pets")
      .then((r) => r.json())
      .then((data: UserPet[]) => setUserPets(data));
  }, []);

  useEffect(() => {
    if (!selectedPetIds.length) return;
    setIsLoadingServices(true);
    const q = new URLSearchParams();
    selectedPetIds.forEach((id) => q.append("pet", id));
    fetch(`/api/services/filtered?${q.toString()}`)
      .then((r) => r.json())
      .then((sv: Service[]) => setAllServices(sv))
      .finally(() => setIsLoadingServices(false));
  }, [selectedPetIds]);

  const handleChange = (petId: string, delta: number) => {
    setCounts((prev) => {
      const species = getSpeciesById(petId)!;
      const ownedCount = userPets.filter((up) => up.species === species).length;
      const next = Math.max(0, (prev[petId] || 0) + delta);
      if (next > ownedCount) return prev; // never exceed owned
      if (selectedUserPets[species]?.length) {
        setSelectedUserPets((sel) => ({ ...sel, [species]: [] }));
      }
      return { ...prev, [petId]: next };
    });
  };

  const handleModalSave = (species: string, ids: string[]) => {
    setSelectedUserPets((prev) => ({ ...prev, [species]: ids }));
    setModalSpecies(null);
  };

  const handleSubmit = () => {
    const totalPetCount = Object.values(counts).reduce((s, c) => s + c, 0);
    if (!totalPetCount) return toast.error("En az 1 hayvan belirtin.");
    if (!districtId) return toast.error("İlçe seçin.");
    if (!fullAddress.trim()) return toast.error("Detaylı adres girin.");
    if (services.length === 0) return toast.error("En az 1 hizmet seçin.");

    for (const serviceId of services) {
      const service = allServices.find((s) => s.id === serviceId);
      if (!service) continue;

      const matchedSpecies = service.petTags;
      let totalCount = 0;

      matchedSpecies.forEach((species) => {
        selectedPets.forEach((pet) => {
          if (pet.species === species) {
            totalCount += counts[pet.id] || 0;
          }
        });
      });

      if (totalCount === 0) {
        toast.error(
          `"${service.name}" hizmeti için hayvan seçilmedi. Lütfen önce hayvan sayısını belirtin.`
        );
        return;
      }
    }

    for (const pet of selectedPets) {
      const count = counts[pet.id] || 0;
      if (count === 0) continue;
      const hasService = allServices.some(
        (s) => services.includes(s.id) && s.petTags.includes(pet.species)
      );
      if (!hasService) {
        toast.error(
          `"${pet.name}" için bir hizmet seçilmedi. Lütfen önce hizmet seçin.`
        );
        return;
      }
    }

    const params = new URLSearchParams();
    Object.entries(counts).forEach(([id, cnt]) => {
      if (cnt > 0) {
        params.append("pet", id);
        params.append(id, cnt.toString());
      }
    });
    services.forEach((s) => params.append("service", s));
    params.set("district", districtId);
    params.set("fullAddress", fullAddress);
    params.set("unitPrice", totalPrice.toString()); // Artık günlük fiyat

    router.push(`/request/step2?${params.toString()}`);
  };

  const selectedPets = allPets.filter((p) => selectedPetIds.includes(p.id));
  const selectedSpecies = selectedPets.map((p) => p.species);

  const totalPrice = useMemo(() => {
    let total = 0;

    services.forEach((serviceId) => {
      const service = allServices.find((s) => s.id === serviceId);
      if (!service) return;

      const matchedSpecies = service.petTags;
      let totalCount = 0;

      matchedSpecies.forEach((species) => {
        selectedPets.forEach((pet) => {
          if (pet.species === species) {
            totalCount += counts[pet.id] || 0;
          }
        });
      });

      total += service.price * totalCount;
    });

    return total;
  }, [services, allServices, selectedPets, counts]);

  const speciesCounts = useMemo(() => {
    const result: Record<string, number> = {};
    selectedPets.forEach((pet) => {
      const cnt = counts[pet.id] || 0;
      result[pet.species] = (result[pet.species] || 0) + cnt;
    });
    return result;
  }, [counts, selectedPets]);

  return (
    <div className="h-screen grid md:grid-cols-2 overflow-hidden">
      <div className="flex flex-col justify-between p-6 overflow-y-auto">
        <div>
          <div className="sticky top-0 bg-white pb-4 z-10">
            <Stepper activeStep={1} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mt-4"
          >
            ← Geri
          </Button>
          <h1 className="mt-6 text-2xl font-bold">
            Kaç hayvan için hizmet istiyorsunuz?
          </h1>
          <p className="text-muted-foreground mb-4">
            Her tür için sayı belirtin
          </p>

          <div className="grid grid-cols-2 gap-4">
            {isLoadingPets
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[120px] bg-muted animate-pulse rounded-xl"
                  />
                ))
              : selectedPets.map((pet) => {
                  const cnt = counts[pet.id] || 0;
                  const ownedCount = userPets.filter(
                    (up) => up.species === pet.species
                  ).length;
                  const hasUserPet = ownedCount > 0;
                  return (
                    <div
                      key={pet.id}
                      className="relative p-4 bg-white rounded-xl border flex flex-col items-center shadow-sm"
                    >
                      {cnt > 0 && hasUserPet && (
                        <button
                          onClick={() => setModalSpecies(pet.species)}
                          className="absolute top-2 right-2 p-1"
                        >
                          <InfoIcon className="w-5 h-5 text-muted-foreground" />
                        </button>
                      )}

                      <div className="font-medium mb-3 capitalize text-center">
                        {pet.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChange(pet.id, -1)}
                        >
                          <MinusIcon className="w-5 h-5" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {cnt}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChange(pet.id, 1)}
                          disabled={cnt >= ownedCount}
                        >
                          <PlusIcon className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow">
            <Label className="text-sm font-semibold mb-2">Adresim</Label>
            {addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Kayıtlı adresiniz yok.
              </p>
            ) : (
              addresses.map((addr) => (
                <label
                  key={addr.id}
                  className="flex items-center gap-2 text-sm mb-2"
                >
                  <input
                    type="radio"
                    name="addr"
                    checked={selectedAddressId === addr.id}
                    onChange={() => {
                      setSelectedAddressId(addr.id);
                      setDistrictId(addr.districtId);
                      setFullAddress(addr.fullAddress);
                    }}
                    className="mr-2"
                  />
                  {addr.fullAddress}
                </label>
              ))
            )}
          </div>

          <div className="mt-4 rounded-2xl border bg-white p-4 shadow">
            <Label className="text-sm font-semibold mb-2">Hizmet Türleri</Label>
            {isLoadingServices ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-muted animate-pulse rounded-md mb-2"
                  />
                ))}
              </div>
            ) : allServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Uygun hizmet bulunamadı.
              </p>
            ) : (
              <FilteredServiceSelect
                counts={speciesCounts}
                allServices={allServices}
                selectedPetSpecies={selectedSpecies}
                selected={services}
                setSelected={setServices}
              />
            )}
          </div>
        </div>

        <div className="mt-4 text-right">
          <p className="text-lg font-semibold mb-2">Toplam: {totalPrice}₺</p>
          <Button size="lg" className="w-full md:w-auto" onClick={handleSubmit}>
            Devam Et
          </Button>
        </div>
      </div>

      <div className="relative hidden md:flex items-center justify-center bg-gray-50">
        <Image
          src="https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?q=80&w=688"
          alt="Evde hayvan bakımı"
          fill
          className="object-cover"
        />
        <div className="absolute bottom-6 left-6 bg-white/90 rounded-lg p-4 shadow-md max-w-sm">
          <p className="italic text-sm text-gray-700">
            “Evde hayvan bakımı çok daha konforlu. Hizmet mükemmeldi.”
          </p>
          <p className="mt-2 font-semibold">Can · Türkiye</p>
        </div>
      </div>

      {/* PetSelectModal */}
      {modalSpecies && (
        <PetSelectModal
          species={modalSpecies}
          ownedPets={userPets.filter((up) => up.species === modalSpecies)}
          maxCount={
            counts[
              selectedPetIds.find((id) => getSpeciesById(id) === modalSpecies)!
            ] || 0
          }
          selectedIds={selectedUserPets[modalSpecies] || []}
          onSave={handleModalSave}
          onClose={() => setModalSpecies(null)}
        />
      )}
    </div>
  );
}
