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
import { DateRange } from "react-day-picker";

export default function SearchBox() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (location) params.set("fullAddress", location);
    if (dateRange?.from)
      params.set("startDate", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to)
      params.set("endDate", format(dateRange.to, "yyyy-MM-dd"));
    router.push(`/request/step1?${params.toString()}`);
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
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "dd MMMM", { locale: tr })} - ${format(dateRange.to, "dd MMMM", { locale: tr })}`
              : "Tarih Aralığı Seçin"}
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
          />
        </PopoverContent>
      </Popover>

      <Button
        onClick={handleSearch}
        disabled={loading}
        className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-md font-semibold"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 mr-2 inline-block text-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          </>
        ) : (
          "Ara"
        )}
      </Button>
    </div>
  );
}
