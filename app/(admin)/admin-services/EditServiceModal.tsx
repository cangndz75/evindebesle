"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

type Pet = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isActive: boolean;
  createdAt: string;
  tags: { pet: Pet }[];
};

type Props = {
  service: Service;
  onSuccess: () => void;
};

export function EditServiceModal({ service, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
  });

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/pets")
        .then((res) => res.json())
        .then(setPets)
        .catch(() => setPets([]));
    }
  }, [open]);

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        description: service.description || "",
        price: String(service.price),
        image: service.image || "",
      });
      setSelectedPetIds(service.tags.map((t) => t.pet.id));
    }
  }, [service]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePet = (id: string) => {
    setSelectedPetIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          image: form.image,
          petIds: selectedPetIds,
        }),
      });

      if (res.ok) {
        setOpen(false);
        onSuccess();
      } else {
        const errorData = await res.json();
        alert(
          "Güncelleme başarısız: " + (errorData.error || "Bilinmeyen hata")
        );
      }
    } catch (error) {
      alert("Hata oluştu: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hizmet Düzenle</DialogTitle>
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
            placeholder="Fiyat (₺)"
            name="price"
            value={form.price}
            type="number"
            onChange={handleChange}
          />
          <Input
            placeholder="Görsel URL (opsiyonel)"
            name="image"
            value={form.image}
            onChange={handleChange}
          />
          <div>
            <Label>Hangi Hayvan Türlerine Uygun?</Label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border rounded p-2">
              {pets.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Yükleniyor veya pet bulunamadı...
                </p>
              )}
              {pets.map((pet) => (
                <label
                  key={pet.id}
                  className="flex items-center space-x-2 cursor-pointer select-none"
                >
                  <Checkbox
                    checked={selectedPetIds.includes(pet.id)}
                    onCheckedChange={() => togglePet(pet.id)}
                  />
                  <span>{pet.name}</span>
                </label>
              ))}
            </div>
          </div>
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
  );
}
