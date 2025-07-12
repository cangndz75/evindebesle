"use client"

import { useState } from "react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon, CheckIcon } from "lucide-react"

const districts = [
  "Kadıköy", "Maltepe", "Ataşehir", "Üsküdar", "Kartal",
  "Pendik", "Tuzla", "Sancaktepe", "Çekmeköy", "Şile"
]

export default function DistrictSelect({ onSelect }: { onSelect: (val: string) => void }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState("")

  const handleSelect = (val: string) => {
    setSelected(val)
    onSelect(val)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {selected || "İlçe seçin"}
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full">
        {districts.map((d) => (
          <div
            key={d}
            className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-accent rounded-md"
            onClick={() => handleSelect(d)}
          >
            {d}
            {selected === d && <CheckIcon size={16} />}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
