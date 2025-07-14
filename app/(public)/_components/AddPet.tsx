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
import { useState } from "react";

export function AddPetModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    let image = imageURL;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      image = uploadData.url;
    }

    await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, image }),
    });

    setLoading(false);
    setOpen(false);
    setName("");
    setImageURL("");
    setFile(null);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          Yeni Pet Ekle
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni Pet Ekle</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Input
            placeholder="Pet adı"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Görsel URL (isteğe bağlı)"
            value={imageURL}
            onChange={(e) => setImageURL(e.target.value)}
          />
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={loading || !name}
            onClick={handleSubmit}
            className="w-full sm:w-auto"
          >
            {loading ? "..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
