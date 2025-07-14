"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function SearchBox() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date | null>(new Date());
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (location) params.set("fullAddress", location);
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    router.push(`/request?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto -mt-16 relative z-10 shadow-lg rounded-xl bg-white p-6 flex flex-col md:flex-row gap-4 items-center">
      <input
        type="text"
        placeholder="Konum (örnek: Kadıköy)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full border px-4 py-3 rounded-md"
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={() => setOpen(!open)}
            className="w-full border px-4 py-3 rounded-md text-left bg-white text-black"
          >
            {date
              ? format(date, "dd MMMM yyyy", { locale: tr })
              : "Tarih seçin"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 mt-[-140px]" align="start">
          <Calendar
            mode="single"
            selected={date ?? undefined}
            onSelect={(d) => {
              setDate(d ?? null);
              setOpen(false);
            }}
            initialFocus
            locale={tr}
          />
        </PopoverContent>
      </Popover>

      <Button
        onClick={handleSearch}
        disabled={loading}
        className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-md font-semibold"
      >
        {loading ? "Yükleniyor..." : "Ara"}
      </Button>
    </div>
  );
}
