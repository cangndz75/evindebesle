"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SearchBox() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("district", location);
    if (date) params.set("date", date);
    router.push(`/request/step1?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto -mt-16 relative z-10 shadow-lg rounded-xl bg-white p-6 flex flex-col md:flex-row gap-4 items-center">
      <input
        type="text"
        placeholder="Konum (örnek: Kadıköy)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="flex-1 border px-4 py-3 rounded-md"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="flex-1 border px-4 py-3 rounded-md"
      />
      <Button
        onClick={handleSearch}
        className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-md font-semibold"
      >
        Ara
      </Button>
    </div>
  );
}
