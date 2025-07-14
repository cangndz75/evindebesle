"use client"

import { useState } from "react"

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}) {
  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  return (
    <div className="border rounded-lg p-2 space-y-2">
      <div className="text-sm text-muted-foreground">
        {selected.length > 0
          ? `${selected.length} hizmet seçildi`
          : placeholder || "Seçim yapılmadı"}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-3 py-1 rounded-full text-sm border ${
              selected.includes(opt.value)
                ? "bg-blue-100 border-blue-500 text-blue-600"
                : "bg-white border-gray-300 text-gray-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
