"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DistrictSelect({ onSelect }: { onSelect: (id: string) => void }) {
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch("/api/districts")
      .then((res) => res.json())
      .then(setDistricts)
  }, [])

  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Bir ilçe seçin" />
      </SelectTrigger>
      <SelectContent>
        {districts.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            {d.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
