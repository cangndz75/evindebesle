"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Stepper from "@/app/(public)/_components/Stepper";
import FilteredServiceSelect from "@/app/(public)/_components/FilteredServiceSelect";
import PetSelectModal from "../_components/PetSelectModal";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import PetNoteTabs from "./_components/PetNoteTabs";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddressForm from "@/app/(account)/profile/addresses/AddressForm";
import SecurePaymentInfo from "../_components/SecurePaymentInfo";
import PetSelectorBlock from "./_components/PetSelectorBlock";

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

export default function Step1Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedPetIds = useMemo(
    () => searchParams.getAll("pet") as string[],
    [searchParams]
  );
  const [me, setMe] = useState<Address | null>(null);
  const [primaryAddress, setPrimaryAddress] = useState<{
    id: string;
    fullAddress: string;
    districtId: string;
  } | null>(null);
  const [selectedUserPets, setSelectedUserPets] = useState<
    Record<string, string[]>
  >({});

  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [userPets, setUserPets] = useState<UserPet[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [services, setServices] = useState<string[]>(
    searchParams.getAll("service") as string[]
  );
  const [user, setUser] = useState<any>(null);

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
  const [freeFormDetails, setFreeFormDetails] = useState<
    Record<
      string,
      { allergy?: string; sensitivity?: string; specialNote?: string }[]
    >
  >({});

  const getSpeciesById = (id: string) =>
    allPets.find((p) => p.id === id)?.species;

  const searchDistrict = searchParams.get("district");
  const searchFullAddress = searchParams.get("fullAddress");
  const { data: session } = useSession();
  const [showAddressModal, setShowAddressModal] = useState(false);

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
    if (!me && searchDistrict && searchFullAddress) {
      const searchAddr: Address = {
        id: "search",
        districtId: searchDistrict,
        fullAddress: searchFullAddress,
        isPrimary: false,
      };
      setAddresses([searchAddr]);
      setSelectedAddressId(searchAddr.id);
      setDistrictId(searchDistrict);
      setFullAddress(searchFullAddress);
    }
  }, [me, searchDistrict, searchFullAddress]);

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
      .catch((err) => console.error("❌ Pet verileri alınamadı:", err))
      .finally(() => setIsLoadingPets(false));
  }, []);

  useEffect(() => {
    fetch("/api/user-pets")
      .then((r) => {
        if (!r.ok) return [];
        return r.json();
      })
      .then((data: UserPet[]) => setUserPets(Array.isArray(data) ? data : []))
      .catch((err) => console.error("❌ UserPet verileri alınamadı:", err));
  }, []);

  useEffect(() => {
    if (!selectedPetIds.length) return;
    setIsLoadingServices(true);
    const q = new URLSearchParams();
    selectedPetIds.forEach((id) => q.append("pet", id));
    fetch(`/api/services/filtered?${q.toString()}`)
      .then((r) => r.json())
      .then((sv: Service[]) => setAllServices(sv))
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
          delete newSelected[species];
          return newSelected;
        });
      }

      return { ...prev, [petId]: next };
    });
  };

  const handleModalSave = (species: string, ids: string[]) => {
    setSelectedUserPets((prev) => ({ ...prev, [species]: ids }));
    setModalSpecies(null);
  };

  const handlePetSelect = (species: string, ids: string[]) => {
    setSelectedUserPets((prev) => ({ ...prev, [species]: ids }));
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
      Object.entries(freeFormDetails).forEach(([petId, infos]) => {
        infos.forEach((info, idx) => {
          if (info.allergy)
            params.append(`${petId}_${idx}_allergy`, info.allergy);
          if (info.sensitivity)
            params.append(`${petId}_${idx}_sensitivity`, info.sensitivity);
          if (info.specialNote)
            params.append(`${petId}_${idx}_specialNote`, info.specialNote);
        });
      });
    }

    if (isAuthenticated) {
      Object.values(selectedUserPets)
        .flat()
        .forEach((userPetId) => {
          params.append("userPetId", userPetId);
        });
    }

    services.forEach((s) => params.append("service", s));
    params.set("district", districtId!);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("fullAddress", fullAddress);
    params.set("userAddressId", selectedAddressId!);
    params.set("unitPrice", totalPrice.toString());

    console.log("📤 Gönderilen parametreler:", params.toString());
    router.push(`/request/step2?${params.toString()}`);
  };

  const selectedPets = allPets.filter((p) => selectedPetIds.includes(p.id));
  const selectedSpecies = selectedPets.map((p) => p.species);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

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

  if (!user?.fullAddress && searchDistrict && searchFullAddress) {
    const searchAddr: Address = {
      id: "search",
      districtId: searchDistrict,
      fullAddress: searchFullAddress,
      isPrimary: false,
    };
    setAddresses([searchAddr]);
    setSelectedAddressId(searchAddr.id);
    setDistrictId(searchDistrict);
    setFullAddress(searchFullAddress);
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
          <p className="text-muted-foreground mb-4">
            Her tür için sayı belirtin
          </p>

          <div className="space-y-6 mb-6">
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
                  <div key={pet.species} className="space-y-3">
                    <div className="flex items-center gap-4">
                      <h2 className="text-lg font-semibold">{pet.name}</h2>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleChange(pet.id, -1)}
                          disabled={(counts[pet.id] || 0) === 0}
                        >
                        </Button>
                        <span className="w-8 text-center">
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
                    {counts[pet.id] > 0 && isLoggedInWithPets && (
                      <PetSelectorBlock
                        species={pet.species}
                        speciesName={pet.name}
                        userPets={userPets}
                        selectedIds={selectedUserPets[pet.species] || []}
                        setSelectedIds={(ids) => handlePetSelect(pet.species, ids)}
                        onRefetch={async () => {
                          const res = await fetch("/api/user-pets");
                          const data = await res.json();
                          setUserPets(Array.isArray(data) ? data : []);
                        }}
                      />
                    )}
                  </div>
                ))}
          </div>

          {Object.entries(counts).map(([petId, count]) =>
            count > 0 && (isGuestUser || isRegisteredNoPets) ? (
              <PetNoteTabs
                key={petId}
                petId={petId}
                speciesName={
                  selectedPets.find((p) => p.id === petId)?.name || "Pet"
                }
                count={count}
                details={Array.from(
                  { length: count },
                  (_, i) => freeFormDetails[petId]?.[i] || {}
                )}
                onUpdate={(
                  index: number,
                  field: "allergy" | "sensitivity" | "specialNote",
                  value: string
                ) => {
                  setFreeFormDetails((prev) => {
                    const arr = prev[petId] ? [...prev[petId]] : [];
                    arr[index] = { ...arr[index], [field]: value };
                    return { ...prev, [petId]: arr };
                  });
                }}
              />
            ) : null
          )}

          <div className="mt-6 rounded-2xl border bg-white p-4 shadow">
            <Label className="text-sm font-semibold mb-2">Adresim</Label>
            {!primaryAddress ? (
              <p className="text-sm text-muted-foreground mt-4">
                Kayıtlı adresiniz yok.
              </p>
            ) : (
              <div className="mt-2">
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
              className="mt-2"
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
      </div>

      <div className="relative hidden md:flex items-center justify-center bg-gray-50">
        <div className="absolute bottom-6 right-6 bg-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-4 z-50">
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