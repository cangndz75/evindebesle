"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

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
      <div className="w-full max-w-7xl bg-white rounded-3xl p-10 shadow-2xl">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-4 text-gray-900">
          Hangi hayvanlara sahipsiniz?
        </h2>
        <p className="text-center text-gray-600 mb-8 text-base sm:text-lg">
          Size en uygun bakımı sunabilmemiz için seçim yapın.
        </p>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="animate-spin h-10 w-10 text-gray-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2">
              {pets.map((pet) => {
                const isActive = selected.includes(pet.id);
                return (
                  <button
                    key={pet.id}
                    onClick={() => toggle(pet.id)}
                    className={`relative flex-none w-36 sm:w-40 rounded-xl overflow-hidden shadow-md transition-all duration-300 ${
                      isActive
                        ? "ring-4 ring-lime-500 border-2 border-white"
                        : "hover:scale-105"
                    }`}
                  >
                    <img
                      src={pet.image}
                      alt={pet.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center flex-col text-white font-bold text-lg">
                      {pet.name}
                      {isActive && (
                        <CheckCircle2 className="text-lime-400 mt-2 w-6 h-6" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center mt-10">
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
