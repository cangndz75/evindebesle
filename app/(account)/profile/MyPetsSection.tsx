"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import PetAddModal from "./PetAddModal";
import { Skeleton } from "@/components/ui/skeleton";

type UserPet = {
  id: string;
  petName?: string;
  userPetName?: string;
  species?: string;
  breed?: string;
  age?: number;
  gender?: string;
  image?: string;
  relation?: string;
  allergy?: string;
  sensitivity?: string;
  specialNote?: string;
  allowAdUse?: boolean;
};

export default function MyPetsSection() {
  const [pets, setPets] = useState<UserPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const fetchPets = async () => {
    try {
      const res = await fetch("/api/user-pets");
      if (!res.ok) {
        const errText = await res.text();
        console.error("Sunucu hatası:", res.status, errText);
        return;
      }
      const data = await res.json();
      setPets(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Evcil Hayvanlarım</h2>
        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white rounded px-4 py-2 text-sm"
        >
          + Ekle
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border rounded-lg p-3"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="w-40 h-4" />
                  <Skeleton className="w-32 h-3" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
              <Skeleton className="w-5 h-5 rounded-full" />
            </div>
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div className="text-gray-500">Henüz kayıtlı hayvanınız yok.</div>
      ) : (
        <div className="grid gap-4">
          {pets.map((pet) => (
            <div
              key={pet.id}
              onClick={() => router.push(`/pets/${pet.id}`)}
              className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-4">
                <img
                  src={pet.image || "/pet-placeholder.png"}
                  alt={pet.petName}
                  className="w-12 h-12 rounded-full object-cover bg-gray-200"
                />
                <div>
                  <div className="font-semibold">
                    {pet.userPetName || pet.petName}
                  </div>
                  <div className="text-xs text-gray-600">
                    {pet.species} {pet.breed ? `/ ${pet.breed}` : ""}
                  </div>
                  {pet.age && (
                    <div className="text-xs text-gray-500">Yaş: {pet.age}</div>
                  )}
                  {pet.gender && (
                    <div className="text-xs text-gray-500">
                      Cinsiyet: {pet.gender}
                    </div>
                  )}
                  {pet.relation && (
                    <div className="text-xs text-gray-500">{pet.relation}</div>
                  )}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      )}

      <PetAddModal
        open={open}
        onClose={() => setOpen(false)}
        onAdded={() => {
          setOpen(false);
          setLoading(true);
          fetchPets();
        }}
      />
    </div>
  );
}
