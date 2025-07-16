"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Pet = {
  id: string;
  name: string;
  image?: string;
};

export function AdminEditPetModal({
  pet,
  onSuccess,
  trigger,
}: {
  pet: Pet;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(pet.name);
  const [image, setImage] = useState(pet.image || "");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await fetch(`/api/admin-pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, image }),
    });

    setLoading(false);
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Düzenle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogTitle>Evcil Hayvanı Düzenle</DialogTitle>

        <div className="space-y-4 mt-4">
          <label className="block text-sm font-medium">Adı</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium">Görsel</label>
            {image ? (
              <img
                src={image}
                alt="Pet"
                className="h-24 w-24 object-cover rounded"
              />
            ) : (
              <div className="h-24 w-24 bg-muted flex items-center justify-center text-xs text-muted-foreground rounded">
                Yok
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2 inline-block text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
