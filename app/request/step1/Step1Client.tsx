"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, MinusIcon, CheckIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Stepper from "@/app/(public)/_components/Stepper";
import FilteredServiceSelect from "@/app/(public)/_components/FilteredServiceSelect";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddressForm from "@/app/(account)/profile/addresses/AddressForm";
import { CheckCircle2Icon, XIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import clsx from "clsx";
import { cn } from "@/lib/utils";

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

type PrimaryAddress = {
  id: string;
  districtId: string;
  fullAddress: string;
};

function PetSelectorBlock({
  species,
  speciesName,
  userPets,
  selectedIds,
  setSelectedIds,
  onRefetch,
}: {
  species: string;
  speciesName: string;
  userPets: UserPet[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  onRefetch: () => void;
}) {
  const router = useRouter();
  const filtered = userPets.filter((p) => p.species === species);

  const toggleSelect = async (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((pid) => pid !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelected);
    await onRefetch();
  };

  const selectedPet =
    filtered.find((pet) => selectedIds.includes(pet.id)) || filtered[0];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3">{speciesName}</h2>
      {filtered.length === 0 ? (
        <div className="border rounded-lg p-4">
          <p className="mb-2 text-sm text-muted-foreground">
            Kayıtlı bir {speciesName} yok. Hemen ekleyin!
          </p>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/account/profile/pet/add?species=${species}`)
            }
          >
            <PlusIcon className="mr-2 w-4 h-4" /> {speciesName} Ekle
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => toggleSelect(selectedPet.id)}
            className={`relative w-32 h-32 rounded-xl overflow-hidden shadow-md border flex items-center justify-center bg-white transition-all ${
              selectedIds.includes(selectedPet.id)
                ? "border-lime-500 ring-2 ring-lime-400"
                : "border-gray-200"
            }`}
          >
            <div className="relative w-20 h-20">
              <Image
                src={
                  selectedPet.image ||
                  "https://example.com/default-pet-logo.png"
                }
                alt={selectedPet.userPetName || "Default Pet"}
                fill
                className="object-contain"
              />
            </div>
            <div className="text-center mt-2">
              <p className="text-sm font-medium">
                {selectedPet.userPetName || "Test"}
              </p>
              <p className="text-xs text-muted-foreground">{speciesName}</p>
            </div>
            {selectedIds.includes(selectedPet.id) && (
              <CheckIcon className="absolute top-2 right-2 w-5 h-5 text-lime-500 bg-white rounded-full" />
            )}
          </button>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/account/profile/pet/add?species=${species}`)
            }
            className="w-32"
          >
            <PlusIcon className="mr-2 w-4 h-4" /> {speciesName} Ekle
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Step1Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedPetIds = useMemo(
    () => searchParams.getAll("pet") as string[],
    [searchParams]
  );
  const [me, setMe] = useState<Address | null>(null);
  const [primaryAddress, setPrimaryAddress] = useState<PrimaryAddress | null>(
    null
  );
  const [selectedUserPets, setSelectedUserPets] = useState<
    Record<string, string[]>
  >({});
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [userPets, setUserPets] = useState<UserPet[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [services, setServices] = useState<Record<string, string[]>>({
    ...selectedPetIds.reduce(
      (acc, id) => {
        const species = allPets.find((p) => p.id === id)?.species;
        if (species) acc[species] = searchParams.getAll("service") as string[];
        return acc;
      },
      {} as Record<string, string[]>
    ),
  });
  const [userData, setUser] = useState<any>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [fullAddress, setFullAddress] = useState<string>("");

  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [modalSpecies, setModalSpecies] = useState<string | null>(null);

  const { data: session } = useSession();

  const getSpeciesById = (id: string) =>
    allPets.find((p) => p.id === id)?.species;

  useEffect(() => {
    const fetchPrimaryAddress = async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (res.ok) {
        setPrimaryAddress(data.primaryAddress ?? null);
      }
    };
    fetchPrimaryAddress();
  }, []);

  useEffect(() => {
    if (
      !me &&
      searchParams.get("district") &&
      searchParams.get("fullAddress")
    ) {
      const searchAddr: Address = {
        id: "search",
        districtId: searchParams.get("district")!,
        fullAddress: searchParams.get("fullAddress")!,
        isPrimary: false,
      };
      setAddresses([searchAddr]);
      setSelectedAddressId(searchAddr.id);
      setDistrictId(searchAddr.districtId);
      setFullAddress(searchAddr.fullAddress);
    }
  }, [me, searchParams]);

  useEffect(() => {
    setIsLoadingPets(true);
    fetch("/api/pets")
      .then((res) => res.json())
      .then((data: Pet[]) => {
        setAllPets(data);
        const initialCounts: Record<string, number> = {};
        selectedPetIds.forEach((id) => {
          initialCounts[id] = 0;
        });
        setCounts(initialCounts);

        const initialServices: Record<string, string[]> = {};
        selectedPetIds.forEach((id) => {
          const species = getSpeciesById(id);
          if (species)
            initialServices[species] = searchParams.getAll(
              "service"
            ) as string[];
        });
        setServices((prev) => ({ ...prev, ...initialServices }));
      })
      .catch((err) => console.error("❌ Pet verileri alınamadı:", err))
      .finally(() => setIsLoadingPets(false));
  }, [selectedPetIds]);

  useEffect(() => {
    fetch("/api/user-pets")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: UserPet[]) => setUserPets(Array.isArray(data) ? data : []))
      .catch((err) => console.error("❌ UserPet verileri alınamadı:", err));
  }, []);

  useEffect(() => {
    if (!selectedPetIds.length) return;
    setIsLoadingServices(true);
    const query = new URLSearchParams();
    selectedPetIds.forEach((id) => query.append("pet", id));
    fetch(`/api/services/filtered?${query.toString()}`)
      .then((res) => res.json())
      .then((data: Service[]) => setAllServices(data))
      .catch((err) => console.error("❌ Hizmet verileri alınamadı:", err))
      .finally(() => setIsLoadingServices(false));
  }, [selectedPetIds]);

  const isGuestUser = !isAuthenticated;
  const isRegisteredNoPets = isAuthenticated && userPets.length === 0;
  const isLoggedInWithPets = isAuthenticated && userPets.length > 0;

  const handleChange = (petId: string, delta: number) => {
    setCounts((prev) => {
      const species = getSpeciesById(petId)!;
      const ownedCount = userPets.filter((up) => up.species === species).length;
      const next = Math.max(0, (prev[petId] || 0) + delta);

      if (isAuthenticated && ownedCount > 0 && next > ownedCount) {
        toast.error(`Maksimum ${ownedCount} ${species} seçebilirsiniz.`);
        return prev;
      }

      if (next === 0) {
        setSelectedUserPets((prev) => {
          const newSelected = { ...prev };
          if (newSelected[species]?.length === 0) delete newSelected[species];
          return newSelected;
        });
        setServices((prev) => {
          const newServices = { ...prev };
          if (newServices[species]?.length === 0) delete newServices[species];
          return newServices;
        });
      }

      return { ...prev, [petId]: next };
    });
  };

  const handleServiceChange = (species: string, newServices: string[]) => {
    setServices((prev) => ({
      ...prev,
      [species]: newServices,
    }));
  };

  const handleModalSave = (species: string, ids: string[]) => {
    setSelectedUserPets((prev) => ({ ...prev, [species]: ids }));
    setModalSpecies(null);
  };

  const handlePetSelect = (species: string, ids: string[]) => {
    setSelectedUserPets((prev) => ({ ...prev, [species]: ids }));
  };

  const handleSubmit = () => {
    const totalPetCount = Object.values(counts).reduce(
      (sum, count) => sum + count,
      0
    );
    if (!totalPetCount) return toast.error("En az 1 hayvan belirtin.");
    if (!districtId) return toast.error("İlçe seçin.");
    if (!fullAddress.trim()) return toast.error("Detaylı adres girin.");
    const hasAnyServices = Object.values(services).some((sv) => sv.length > 0);
    if (!hasAnyServices) return toast.error("En az 1 hizmet seçin.");

    for (const species in services) {
      const serviceIds = services[species];
      for (const serviceId of serviceIds) {
        const service = allServices.find((s) => s.id === serviceId);
        if (!service) continue;

        const matchedSpecies = service.petTags;
        let totalCount = 0;

        matchedSpecies.forEach((sp) => {
          if (sp === species) {
            selectedPets.forEach((pet) => {
              if (pet.species === sp) totalCount += counts[pet.id] || 0;
            });
          }
        });

        if (totalCount === 0) {
          toast.error(
            `"${service.name}" hizmeti için ${species} seçilmedi. Lütfen önce hayvan sayısını belirtin.`
          );
          return;
        }
      }
    }

    for (const pet of selectedPets) {
      const count = counts[pet.id] || 0;
      if (count === 0) continue;
      const hasService = services[pet.species]?.length > 0;
      if (!hasService) {
        toast.error(
          `"${pet.name}" için bir hizmet seçilmedi. Lütfen önce hizmet seçin.`
        );
        return;
      }
    }

    if (isAuthenticated) {
      for (const pet of selectedPets) {
        const count = counts[pet.id] || 0;
        if (count === 0) continue;
        const species = pet.species;
        const selectedUserPetIds = selectedUserPets[species] || [];
        const ownedCount = userPets.filter(
          (up) => up.species === species
        ).length;

        if (ownedCount > 0 && selectedUserPetIds.length !== count) {
          toast.error(
            `"${species}" için ${count} hayvan seçtiniz, ancak ${selectedUserPetIds.length} evcil hayvan seçildi. Lütfen doğru sayıda evcil hayvan seçin.`
          );
          return;
        }
      }
    }

    const params = new URLSearchParams();
    Object.entries(counts).forEach(([id, cnt]) => {
      if (cnt > 0) {
        params.append("pet", id);
        params.append(id, cnt.toString());
      }
    });

    if (isGuestUser || isRegisteredNoPets) {
      // Not ekleme kısmı kaldırıldı
    }

    if (isAuthenticated) {
      Object.values(selectedUserPets)
        .flat()
        .forEach((userPetId) => params.append("userPetId", userPetId));
    }

    for (const species in services) {
      services[species].forEach((serviceId) =>
        params.append("service", serviceId)
      );
    }
    params.set("district", districtId!);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("fullAddress", fullAddress);
    params.set("userAddressId", selectedAddressId!);
    params.set("unitPrice", totalPrice.toString());

    console.log("📤 Gönderilen parametreler:", params.toString());
    router.push(`/request/step2?${params.toString()}`);
  };

  const selectedPets = useMemo(
    () => allPets.filter((p) => selectedPetIds.includes(p.id)),
    [allPets, selectedPetIds]
  );
  const selectedSpecies = useMemo(
    () => selectedPets.map((p) => p.species),
    [selectedPets]
  );
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const totalPrice = useMemo(() => {
    let total = 0;
    for (const species in services) {
      const serviceIds = services[species];
      serviceIds.forEach((serviceId) => {
        const service = allServices.find((s) => s.id === serviceId);
        if (!service) return;
        const matchedSpecies = service.petTags;
        let totalCount = 0;
        matchedSpecies.forEach((sp) => {
          if (sp === species) {
            selectedPets.forEach((pet) => {
              if (pet.species === sp) totalCount += counts[pet.id] || 0;
            });
          }
        });
        total += service.price * totalCount;
      });
    }
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

  if (
    !userData?.fullAddress &&
    searchParams.get("district") &&
    searchParams.get("fullAddress")
  ) {
    const searchAddr: Address = {
      id: "search",
      districtId: searchParams.get("district")!,
      fullAddress: searchParams.get("fullAddress")!,
      isPrimary: false,
    };
    setAddresses([searchAddr]);
    setSelectedAddressId(searchAddr.id);
    setDistrictId(searchAddr.districtId);
    setFullAddress(searchAddr.fullAddress);
  }

  return (
    <div className="grid md:grid-cols-2 h-screen">
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
          <p className="text-muted-foreground mb-6">
            Her tür için sayı belirtin
          </p>

          <div className="space-y-10 mb-24">
            {isLoadingPets || selectedPets.length === 0
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="h-6 bg-muted animate-pulse rounded" />
                      <div className="h-6 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))
              : selectedPets.map((pet) => (
                  <div key={pet.species} className="space-y-6">
                    {/* Sayı seçici görselli UI */}
                    <div className="flex items-center justify-between border rounded-xl p-4 shadow-sm bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 relative rounded-full overflow-hidden border">
                          <Image
                            src={pet.image || "/placeholder.jpg"}
                            alt={pet.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <h2 className="text-base font-semibold">{pet.name}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleChange(pet.id, -1)}
                          disabled={(counts[pet.id] || 0) === 0}
                        >
                          <MinusIcon className="w-4 h-4" />
                        </Button>
                        <span className="w-6 text-center font-semibold">
                          {counts[pet.id] || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleChange(pet.id, 1)}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Seçilen hayvanlar listesi */}
                    {(counts[pet.id] > 0 || isLoggedInWithPets) && (
                      <div className="mt-2">
                        <h3 className="text-md font-semibold mb-2">
                          Seçilen {pet.name} Hayvanlar:
                        </h3>
                        <ScrollArea className="max-h-[300px] pr-2">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {selectedUserPets[pet.species]?.map((petId) => {
                              const selectedPet = userPets.find(
                                (p) => p.id === petId
                              );
                              return selectedPet ? (
                                <div
                                  key={petId}
                                  className="relative flex flex-col items-center border rounded-xl p-2 text-sm transition hover:shadow-md bg-white"
                                >
                                  <div className="w-16 h-16 rounded-full overflow-hidden mb-1 relative">
                                    <Image
                                      src={
                                        selectedPet.image || "/placeholder.jpg"
                                      }
                                      alt={
                                        selectedPet.userPetName ||
                                        selectedPet.petName ||
                                        "Evcil Hayvan"
                                      }
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="text-center font-medium">
                                    {selectedPet.userPetName ||
                                      selectedPet.petName}
                                  </div>
                                  <CheckCircle2Icon className="absolute top-1 right-1 text-primary w-4 h-4" />
                                </div>
                              ) : null;
                            })}
                          </div>
                        </ScrollArea>
                        <Button
                          variant="outline"
                          onClick={() => setModalSpecies(pet.species)}
                          className="w-full mt-2"
                        >
                          Evcil Hayvan Seç
                        </Button>
                      </div>
                    )}

                    {/* Hizmet seçimi – mobilde yatay scroll */}
                    {(counts[pet.id] > 0 || isLoggedInWithPets) && (
                      <div className="mt-4">
                        <Label className="text-sm font-semibold mb-2 block">
                          {pet.name} Hizmetleri
                        </Label>
                        <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                          <FilteredServiceSelect
                            counts={{ [pet.species]: counts[pet.id] || 0 }}
                            allServices={allServices}
                            selectedPetSpecies={[pet.species]}
                            selected={services[pet.species] || []}
                            setSelected={(newServices) =>
                              handleServiceChange(pet.species, newServices)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
          </div>

          <div className="mt-16 pt-6">
            <h2 className="text-2xl font-bold mb-6">Adresim</h2>
            <div className="rounded-2xl border bg-white p-6 shadow">
              <Label className="text-sm font-semibold mb-4">Adresim</Label>
              {!primaryAddress ? (
                <p className="text-sm text-muted-foreground mt-4">
                  Kayıtlı adresiniz yok.
                </p>
              ) : (
                <div className="mt-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="addr"
                      checked={selectedAddressId === primaryAddress.id}
                      onChange={() => {
                        setSelectedAddressId(primaryAddress.id);
                        setDistrictId(primaryAddress.districtId);
                        setFullAddress(primaryAddress.fullAddress);
                      }}
                      className="mr-2"
                    />
                    {primaryAddress.fullAddress}
                  </label>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  if (!session?.user) {
                    router.push("/login");
                  } else {
                    setShowAddressModal(true);
                  }
                }}
              >
                <PlusIcon className="mr-2 h-4 w-4" /> Adres Ekle
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden md:flex items-center justify-center bg-gray-50">
        <div
          className={cn(
            "fixed md:absolute bottom-0 md:bottom-6 right-0 md:right-6 w-full md:w-auto",
            "bg-white px-4 py-3 md:rounded-xl shadow-lg flex items-center justify-between md:justify-end gap-4 z-50"
          )}
        >
          <span className="font-semibold text-base whitespace-nowrap">
            Toplam: {totalPrice}₺
          </span>
          <Button onClick={handleSubmit}>Devam Et</Button>
        </div>
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

      {modalSpecies && (
        <Dialog
          open={!!modalSpecies}
          onOpenChange={(open) => setModalSpecies(open ? modalSpecies : null)}
        >
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>
                {modalSpecies} için{" "}
                {counts[
                  selectedPetIds.find(
                    (id) => getSpeciesById(id) === modalSpecies
                  )!
                ] || 0}{" "}
                evcil hayvan seçin
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Seçilen: {selectedUserPets[modalSpecies]?.length || 0}/
                {counts[
                  selectedPetIds.find(
                    (id) => getSpeciesById(id) === modalSpecies
                  )!
                ] || 0}
              </p>
            </DialogHeader>
            <ScrollArea className="max-h-[300px] pr-2">
              <div className="grid grid-cols-2 gap-3 mt-4">
                {userPets.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-2 text-center">
                    Bu tür için kayıtlı evcil hayvan bulunamadı.
                  </p>
                ) : (
                  userPets
                    .filter((up) => up.species === modalSpecies)
                    .map((pet) => {
                      const isSelected = (
                        selectedUserPets[modalSpecies] || []
                      ).includes(pet.id);
                      return (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => {
                            const currentIds =
                              selectedUserPets[modalSpecies] || [];
                            const newIds = isSelected
                              ? currentIds.filter((id) => id !== pet.id)
                              : [...currentIds, pet.id];
                            handlePetSelect(modalSpecies, newIds);
                          }}
                          className={clsx(
                            "relative flex flex-col items-center border rounded-xl p-3 text-sm transition hover:shadow-md",
                            isSelected
                              ? "border-primary ring-2 ring-primary/50"
                              : "bg-white"
                          )}
                        >
                          <div className="w-20 h-20 rounded-full overflow-hidden mb-2 relative">
                            <Image
                              src={pet.image || "/placeholder.jpg"}
                              alt={
                                pet.userPetName || pet.petName || "Evcil Hayvan"
                              }
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="text-center font-medium">
                            {pet.userPetName || pet.petName}
                          </div>
                          {isSelected && (
                            <CheckCircle2Icon className="absolute top-2 right-2 text-primary w-5 h-5" />
                          )}
                        </button>
                      );
                    })
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-between mt-4">
              <Button variant="ghost" onClick={() => setModalSpecies(null)}>
                <XIcon className="w-4 h-4 mr-1" /> Vazgeç
              </Button>
              <Button
                disabled={
                  (selectedUserPets[modalSpecies]?.length || 0) !==
                    counts[
                      selectedPetIds.find(
                        (id) => getSpeciesById(id) === modalSpecies
                      )!
                    ] ||
                  userPets.filter((up) => up.species === modalSpecies)
                    .length === 0
                }
                onClick={() =>
                  handleModalSave(
                    modalSpecies,
                    selectedUserPets[modalSpecies] || []
                  )
                }
              >
                Seçimi Onayla
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Adres Ekle</DialogTitle>
          </DialogHeader>
          <AddressForm
            loading={false}
            onSubmit={async (values) => {
              await fetch("/api/address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
              });
              const res = await fetch("/api/address");
              const data: Address[] = await res.json();
              setAddresses(data);
              const last = data[0];
              setSelectedAddressId(last.id);
              setDistrictId(last.districtId);
              setFullAddress(last.fullAddress);
              toast.success("Adres başarıyla eklendi.");
              setShowAddressModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
