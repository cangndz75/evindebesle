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
  city: string;
};

export default function DistrictSelect({
  onSelect,
  value,
}: {
  onSelect: (val: string) => void;
  value?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    fetch("/api/districts")
      .then((res) => res.json())
      .then((data) => setDistricts(data));
  }, []);

  useEffect(() => {
    if (value) {
      setSelected(value);
    }
  }, [value]);

  const handleSelect = (val: string) => {
    setSelected(val);
    onSelect(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selected || "İlçe seçin"}
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-h-60 overflow-auto">
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
