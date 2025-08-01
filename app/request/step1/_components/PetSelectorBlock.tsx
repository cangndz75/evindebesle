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
}: Props) {
  const router = useRouter();
  const filtered = userPets.filter((p) => p.species === species);

  const toggleSelect = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((pid) => pid !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelected);
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3">{speciesName}</h2>

      {filtered.length === 0 ? (
        <div className="border rounded-lg p-4">
          <p className="mb-2 text-sm text-muted-foreground">
            Kayıtlı bir {speciesName} yok. Hemen ekleyin!
          </p>
          <Button
            onClick={() =>
              router.push(`/account/profile/pet/add?species=${species}`)
            }
          >
            + {speciesName} Ekle
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 mb-4">
            {filtered.map((pet) => {
              const selected = selectedIds.includes(pet.id);
              return (
                <button
                  key={pet.id}
                  onClick={() => toggleSelect(pet.id)}
                  className={`relative w-32 rounded-xl overflow-hidden shadow-md border transition-all ${
                    selected
                      ? "border-lime-500 ring-2 ring-lime-400"
                      : "border-gray-200"
                  }`}
                >
                  <div className="w-20 h-20 bg-gray-100 relative rounded-full overflow-hidden mx-auto mt-4">
                    {pet.image ? (
                      <Image
                        src={pet.image}
                        alt={pet.userPetName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        Fotoğraf yok
                      </div>
                    )}
                    {selected && (
                      <CheckIcon className="absolute top-1 right-1 w-5 h-5 text-lime-500 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="p-2 text-sm text-center">
                    <div className="font-medium">{pet.userPetName}</div>
                    <div className="text-muted-foreground">{pet.petName}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() =>
              router.push(`/account/profile/pet/add?species=${species}`)
            }
          >
            <PlusIcon className="mr-2 w-4 h-4" /> {speciesName} Ekle
          </Button>
        </>
      )}
    </div>
  );
}
