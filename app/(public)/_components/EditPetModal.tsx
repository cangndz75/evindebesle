"use client"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useState } from "react"

export function EditPetModal({ pet, onSuccess }: {
  pet: { id: string; name: string; image?: string }
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(pet.name)
  const [image, setImage] = useState(pet.image || "")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)

    let finalImage = image

    if (file) {
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await uploadRes.json()
      finalImage = result.url
    }

    await fetch(`/api/pets/${pet.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, image: finalImage }),
    })

    setLoading(false)
    setOpen(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem className="text-left">Düzenle</DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pet Düzenle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input placeholder="Pet adı" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Görsel URL (isteğe bağlı)" value={image} onChange={(e) => setImage(e.target.value)} />
          <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <DialogFooter>
          <Button disabled={loading || !name} onClick={handleSubmit}>
            Güncelle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
