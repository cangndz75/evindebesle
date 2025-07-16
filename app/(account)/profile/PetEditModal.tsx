"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  pet: {
    id: string;
    userPetName?: string;
    age?: number;
    image?: string;
    allergy?: string;
  };
};

export default function PetEditModal({ open, onClose, onUpdated, pet }: Props) {
  const [name, setName] = useState(pet.userPetName || "");
  const [age, setAge] = useState(pet.age?.toString() || "");
  const [allergy, setAllergy] = useState(pet.allergy || "");
  const [image, setImage] = useState<string | null>(pet.image || null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(pet.userPetName || "");
      setAge(pet.age?.toString() || "");
      setAllergy(pet.allergy || "");
      setImage(pet.image || null);
      setFile(null);
    }
  }, [open, pet]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        if (document.activeElement instanceof HTMLInputElement) {
          document.activeElement.blur();
        }
      });
    }
  }, [open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImage(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    let uploadedImage: string | null = image;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      uploadedImage = uploadData.url;
    }

    await fetch(`/api/user-pets/${pet.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name,
        age: age ? Number(age) : null,
        allergy,
        image: uploadedImage,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    setLoading(false);
    onUpdated();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Evcil Hayvanı Düzenle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Adı</Label>
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              autoFocus={false}
            />
          </div>

          <div className="space-y-1">
            <Label>Yaş</Label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={0}
            />
          </div>

          <div className="space-y-1">
            <Label>Alerji</Label>
            <Input
              value={allergy}
              onChange={(e) => setAllergy(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Görsel</Label>
            {image ? (
              <img
                src={image}
                alt="Pet"
                className="w-24 h-24 object-cover rounded border"
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center border text-xs text-muted-foreground rounded">
                Yok
              </div>
            )}
            <Input type="file" accept="image/*" onChange={handleImageChange} />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4"
          >
            {loading ? (
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : (
              "Kaydet"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
