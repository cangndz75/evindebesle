"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Pet = {
  id: string;
  name: string;
  image: string;
};

export default function PetTypeSelector() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pets")
      .then((res) => res.json())
      .then((data) => setPets(data))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="min-h-screen flex items-center justify-center py-24 px-4 bg-gradient-to-br from-lime-100 via-white to-lime-200">
      <div className="w-full max-w-6xl bg-white rounded-3xl p-10 shadow-2xl">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-4 text-gray-900">
          Hangi hayvanlara sahipsiniz?
        </h2>
        <p className="text-center text-gray-600 mb-10 text-lg">
          Size en uygun bakımı sunabilmemiz için seçim yapın.
        </p>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="animate-spin h-10 w-10 text-gray-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {pets.map((pet) => {
              const isActive = selected.includes(pet.id);
              return (
                <div
                  key={pet.id}
                  onClick={() => toggle(pet.id)}
                  className={`group relative cursor-pointer rounded-xl overflow-hidden shadow-md border-2 transition-all duration-300 ${
                    isActive
                      ? "border-lime-500 ring-2 ring-lime-400"
                      : "border-gray-200 hover:scale-105"
                  }`}
                >
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold text-xl">
                    {pet.name}
                    {isActive && (
                      <CheckCircle2 className="text-lime-400 mt-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <button
            onClick={() => {
              const params = new URLSearchParams();
              selected.forEach((pet) => params.append("pet", pet));
              router.push(`/request?${params.toString()}`);
            }}
            className="px-10 py-4 rounded-full font-bold bg-lime-500 hover:bg-lime-600 text-white transition-all duration-300 shadow-lg"
          >
            Devam Et
          </button>
        </div>
      </div>
    </section>
  );
}
