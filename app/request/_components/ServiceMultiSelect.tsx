"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const allServices = [
  "Mama Takibi", "Günlük Oyun", "Yürüyüş", "Veteriner Ziyareti", "Gözlem", "Fotoğraf Gönderimi"
]

export default function ServiceMultiSelect({
  selected,
  setSelected,
}: {
  selected: string[]
  setSelected: (val: string[]) => void
}) {
  const toggle = (service: string) => {
    setSelected(
      selected.includes(service)
        ? selected.filter((s) => s !== service)
        : [...selected, service]
    )
  }

  return (
    <div className="grid gap-2">
      {allServices.map((s) => (
        <div key={s} className="flex items-center gap-2">
          <Checkbox
            id={s}
            checked={selected.includes(s)}
            onCheckedChange={() => toggle(s)}
          />
          <Label htmlFor={s}>{s}</Label>
        </div>
      ))}
    </div>
  )
}
