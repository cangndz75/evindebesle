"use client"

import { Button } from "@/components/ui/button"

export default function PetCountCard({
  pet,
  count,
  onChange,
}: {
  pet: string
  count: number
  onChange: (delta: number) => void
}) {
  return (
    <div className="p-6 border rounded-xl shadow-md flex flex-col items-center justify-center gap-4">
      <span className="text-lg font-semibold capitalize">{pet}</span>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={() => onChange(-1)}>-</Button>
        <span className="text-xl">{count}</span>
        <Button size="sm" variant="outline" onClick={() => onChange(1)}>+</Button>
      </div>
    </div>
  )
}
