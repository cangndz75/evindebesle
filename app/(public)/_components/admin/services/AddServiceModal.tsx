"use client"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function AddServiceModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    })
    setLoading(false)
    setOpen(false)
    setForm({ name: "", description: "", price: "", image: "" })
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          Yeni Hizmet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Yeni Hizmet Ekle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Input
            placeholder="Ad"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
          <Input
            placeholder="Açıklama"
            name="description"
            value={form.description}
            onChange={handleChange}
          />
          <Input
            type="number"
            placeholder="Fiyat (₺)"
            name="price"
            value={form.price}
            onChange={handleChange}
          />
          <Input
            placeholder="Görsel URL (opsiyonel)"
            name="image"
            value={form.image}
            onChange={handleChange}
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.price}
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
