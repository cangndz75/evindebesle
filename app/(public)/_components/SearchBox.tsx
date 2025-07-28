"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type Pet = { id: string; name: string };
type District = { id: string; name: string };

export default function SearchBox() {
  const router = useRouter();

  const [pets, setPets] = useState<Pet[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [districtId, setDistrictId] = useState<string>("");
  const [fullAddress, setFullAddress] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const [loadingPets, setLoadingPets] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/user-pets")
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setPets(
            data.map((p: any) => ({
              id: p.id,
              name: p.userPetName || p.petName,
            }))
          );
        } else {
          fetch("/api/pets")
            .then((res) => res.json())
            .then((data) =>
              setPets(data.map((p: any) => ({ id: p.id, name: p.name })))
            );
        }
      })
      .catch(() => {
        fetch("/api/pets")
          .then((res) => res.json())
          .then((data) =>
            setPets(data.map((p: any) => ({ id: p.id, name: p.name })))
          );
      })
      .finally(() => setLoadingPets(false));

    fetch("/api/districts")
      .then((res) => res.json())
      .then((data) => setDistricts(data));
  }, []);

  const togglePet = (id: string) => {
    setSelectedPets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSearch = () => {
    if (
      !districtId ||
      !fullAddress ||
      !dateRange?.from ||
      !dateRange?.to ||
      selectedPets.length === 0
    )
      return;

    const params = new URLSearchParams();
    params.set("districtId", districtId);
    params.set("fullAddress", fullAddress);
    params.set("startDate", format(dateRange.from, "yyyy-MM-dd"));
    params.set("endDate", format(dateRange.to, "yyyy-MM-dd"));
    selectedPets.forEach((id) => params.append("petIds", id));

    router.push(`/request/step1?${params.toString()}`);
  };

  return (
    <div className="max-w-6xl mx-auto -mt-16 relative z-10 shadow-lg rounded-xl bg-white p-4 flex flex-col md:flex-row md:items-center gap-3 flex-wrap md:flex-nowrap">
      {/* Pet Seçimi */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {loadingPets ? (
          <>
            <Skeleton className="w-24 h-10 rounded-full" />
            <Skeleton className="w-24 h-10 rounded-full" />
          </>
        ) : pets.length > 0 ? (
          pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => togglePet(pet.id)}
              className={`border px-3 py-2 rounded-full text-sm transition whitespace-nowrap ${
                selectedPets.includes(pet.id)
                  ? "bg-yellow-300 border-yellow-500 text-black font-semibold"
                  : "bg-white border-gray-300 text-gray-600"
              }`}
            >
              🐾 {pet.name}
            </button>
          ))
        ) : (
          <Skeleton className="w-32 h-10 rounded-full mb-2" />
        )}
      </div>

      {/* İlçe */}
      <div className="min-w-[160px] w-full md:w-[160px]">
        <select
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          className="w-full border px-4 py-2 rounded-md"
        >
          <option value="">İlçe seçin</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Adres */}
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          value={fullAddress}
          onChange={(e) => setFullAddress(e.target.value)}
          placeholder="Açık adres"
          className="w-full border px-4 py-2 rounded-md"
        />
      </div>

      {/* Tarih */}
      <div className="min-w-[220px] w-full md:w-[220px]">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={() => setOpen(!open)}
              className="w-full border px-4 py-2 rounded-md text-left bg-white text-black"
            >
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "dd MMMM", { locale: tr })} - ${format(dateRange.to, "dd MMMM", { locale: tr })}`
                : "Tarih Aralığı"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 mt-[-140px]" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                setOpen(false);
              }}
              initialFocus
              locale={tr}
              disabled={(date) =>
                date < new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Ara Butonu */}
      <div className="flex-shrink-0">
        <Button
          onClick={handleSearch}
          disabled={
            !districtId ||
            !fullAddress ||
            selectedPets.length === 0 ||
            !dateRange?.from ||
            !dateRange?.to
          }
          className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-md font-semibold w-full"
        >
          Ara
        </Button>
      </div>
    </div>
  );
}
