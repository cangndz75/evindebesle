'use client';

import { useState } from "react";
import {
  Dog, Cat, Fish, Bird, Rabbit, Turtle, PiggyBank
} from "lucide-react";

const petTypes = [
  { key: "dog", name: "Köpek", icon: Dog },
  { key: "cat", name: "Kedi", icon: Cat },
  { key: "bird", name: "Kuş", icon: Bird },
  { key: "fish", name: "Balık", icon: Fish },
  { key: "rabbit", name: "Küçük Hayvan", icon: Rabbit },
  { key: "turtle", name: "Sürüngen", icon: Turtle },
  { key: "farm", name: "Çiftlik Hayvanı", icon: PiggyBank },
];

export default function PetTypeSelector() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  return (
    <section
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat py-24 px-4 flex items-center justify-center"
    >
      <div className="backdrop-blur-xl bg-black/50 p-10 rounded-3xl max-w-6xl w-full text-white shadow-2xl">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-3 drop-shadow-md">Hangi hayvanlara sahipsiniz?</h2>
        <p className="text-center text-white/80 mb-10 text-lg">
          Size en uygun bakımı sunabilmemiz için seçim yapın.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {petTypes.map(({ key, name, icon: Icon }) => {
            const isActive = selected.includes(key);
            return (
              <div
                key={key}
                onClick={() => toggle(key)}
                className={`cursor-pointer rounded-xl border transition-all duration-300 p-6 flex flex-col items-center justify-center gap-3
                  hover:scale-105 hover:shadow-2xl
                  ${
                    isActive
                      ? "bg-white text-black border-lime-400 shadow-lime-400"
                      : "bg-white/10 text-white border-white/20"
                  }
                `}
              >
                <Icon size={40} className={isActive ? "text-lime-500" : "text-white"} />
                <span className="font-semibold text-md">{name}</span>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => alert("Devam ediliyor...")}
            className="px-10 py-4 rounded-full font-bold bg-lime-400 hover:bg-lime-500 text-black transition-all duration-300 shadow-lg shadow-lime-300"
          >
            Devam Et
          </button>
        </div>
      </div>
    </section>
  );
}
