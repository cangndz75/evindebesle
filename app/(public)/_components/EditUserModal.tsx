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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function EditUserModal({
  user,
  onSuccess,
}: {
  user: any;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...user });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev: typeof form) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    await fetch(`/api/users/${user.id}`, {
      method: "PUT",
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
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Düzenle
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
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
            value={form.phone ?? ""}
            onChange={handleChange}
          />
          <Input
            placeholder="Adres"
            name="address"
            value={form.address ?? ""}
            onChange={handleChange}
          />
          <label className="flex items-center gap-2">
            <Checkbox
              checked={form.isAdmin}
              onCheckedChange={(v) =>
                setForm((prev: typeof form) => ({ ...prev, isAdmin: !!v }))
              }
            />
            Admin mi?
          </label>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            Güncelle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
