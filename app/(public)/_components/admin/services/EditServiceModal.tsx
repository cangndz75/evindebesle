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
import { useState, useEffect } from "react";

type Service = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isActive: boolean;
  createdAt: string;
};

export function EditServiceModal({
  service,
  onSuccess,
}: {
  service: Service;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
  });

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        description: service.description || "",
        price: String(service.price),
        image: service.image || "",
      });
    }
  }, [service]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    await fetch(`/api/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        image: form.image,
      }),
    });
    setLoading(false);
    setOpen(false);
    onSuccess();
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
