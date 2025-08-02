"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type UserPet = {
  id: string;
  userPetName: string;
  petName: string;
  image?: string | null;
  species: string;
};

type Props = {
  species: string;
  speciesName: string;
  userPets: UserPet[];
  onRefetch: () => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
};

export default function PetSelectorBlock({
  species,
  speciesName,
  userPets,
  selectedIds,
  setSelectedIds,
  onRefetch,
}: Props) {
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
