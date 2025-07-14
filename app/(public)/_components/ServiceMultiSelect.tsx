"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { InfoIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Service = {
  id: string
  name: string
  description?: string
  price: number
  isActive: boolean
}

export default function ServiceMultiSelect({
  selected,
  setSelected,
}: {
  selected: string[]
  setSelected: (val: string[]) => void
}) {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) =>
        setServices(data.filter((s: Service) => s.isActive))
      )
  }, [])

  const toggle = (serviceId: string) => {
    setSelected(
      selected.includes(serviceId)
        ? selected.filter((s) => s !== serviceId)
        : [...selected, serviceId]
    )
  }

  return (
    <TooltipProvider>
      <div className="grid gap-3">
        {services.map((s) => (
          <div
            key={s.id}
            className="flex items-start justify-between gap-4 border p-3 rounded-lg bg-muted/50"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id={s.id}
                checked={selected.includes(s.id)}
                onCheckedChange={() => toggle(s.id)}
              />
              <div>
                <Label htmlFor={s.id} className="font-medium">
                  {s.name}
                </Label>
                <div className="text-sm text-muted-foreground">{s.price}₺</div>
              </div>
            </div>

            {s.description && (
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <InfoIcon className="w-4 h-4 text-muted-foreground cursor-pointer mt-1" />
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hizmet detayını gör</p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent className="max-w-xs text-sm text-muted-foreground">
                  {s.description}
                </PopoverContent>
              </Popover>
            )}
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}
