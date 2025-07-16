"use client";

import { useEffect, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, CheckIcon } from "lucide-react";

type District = {
  id: string;
  name: string;
};

export default function DistrictSelect({
  onSelect,
  initial,
}: {
  onSelect: (val: string) => void;
  initial?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(initial || "");
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    fetch("/api/districts")
      .then((res) => res.json())
      .then(setDistricts);
  }, []);

  const handleSelect = (val: string) => {
    setSelected(val);
    onSelect(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {districts.find((d) => d.id === selected)?.name || "İlçe seçin"}
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full">
        {districts.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-accent rounded-md"
            onClick={() => handleSelect(d.id)}
          >
            {d.name}
            {selected === d.id && <CheckIcon size={16} />}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
