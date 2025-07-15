"use client";
import { useEffect, useState } from "react";
import PetAddModal from "./PetAddModal";

type UserPet = {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  image?: string;
  relation?: string;
  allergy?: string;
  sensitivity?: string;
  specialNote?: string;
  allowAdUse?: boolean;
  species?: string;
  breed?: string;
};

export default function MyPetsSection() {
  const [pets, setPets] = useState<UserPet[]>([]);
  const [open, setOpen] = useState(false);

  const fetchPets = async () => {
    const res = await fetch("/api/pets");
    const data = await res.json();
    setPets(data);
  };

  useEffect(() => { fetchPets(); }, []);

  return (
    <div className="max-w-md mx-auto mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Evcil Hayvanlarım</h2>
        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white rounded px-4 py-2 text-sm"
        >
          + Ekle
        </button>
      </div>
      {pets.length === 0 && <div className="text-gray-500">Henüz kayıtlı hayvanınız yok.</div>}
      <div className="grid gap-4">
        {pets.map((pet) => (
          <div key={pet.id} className="flex items-center gap-4 border rounded-lg p-3">
            <img
              src={pet.image || "/pet-placeholder.png"}
              alt={pet.name}
              className="w-12 h-12 rounded-full object-cover bg-gray-200"
            />
            <div>
              <div className="font-semibold">{pet.name}</div>
              <div className="text-xs text-gray-600">{pet.species} {pet.breed ? `/ ${pet.breed}` : ""}</div>
              {pet.age && (
                <div className="text-xs text-gray-500">
                  Yaş: {pet.age}
                </div>
              )}
              {pet.gender && (
                <div className="text-xs text-gray-500">
                  Cinsiyet: {pet.gender}
                </div>
              )}
              {pet.relation && (
                <div className="text-xs text-gray-500">
                  {pet.relation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <PetAddModal
        open={open}
        onClose={() => setOpen(false)}
        onAdded={() => { setOpen(false); fetchPets(); }}
      />
    </div>
  );
}
