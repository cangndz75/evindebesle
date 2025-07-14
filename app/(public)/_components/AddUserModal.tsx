"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export function AddUserModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    subscriptionPlan: "",
    isAdmin: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setOpen(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          Kullanıcı Ekle
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Input
            placeholder="Ad Soyad"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
          <Input
            placeholder="E-posta"
            name="email"
            value={form.email}
            onChange={handleChange}
          />
          <Input
            placeholder="Telefon"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
          <Input
            placeholder="Adres"
            name="address"
            value={form.address}
            onChange={handleChange}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="isAdmin"
              checked={form.isAdmin}
              onCheckedChange={(v) =>
                setForm((prev) => ({ ...prev, isAdmin: !!v }))
              }
            />
            <label htmlFor="isAdmin" className="text-sm">
              Admin mi?
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
