"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFileUpload } from "@/hooks/use-file-upload";
import { UploadIcon, XIcon, ImageIcon, AlertCircleIcon } from "lucide-react";

type Props = {
  onSaved: () => void;
};

type PetType = {
  id: string;
  name: string;
  species?: string;
  image?: string;
};

export default function PetAddForm({ onSaved }: Props) {
  const [speciesOptions, setSpeciesOptions] = useState<PetType[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    allergy: "",
    specialNote: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const maxSizeMB = 5;
  const maxSize = maxSizeMB * 1024 * 1024;

  useEffect(() => {
    fetch("/api/pets")
      .then((res) => res.json())
      .then((data) => {
        setSpeciesOptions(data);
        if (data.length > 0) setSelectedSpecies(data[0].id);
      });
  }, []);

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "image/*",
    maxSize,
    multiple: false,
    maxFiles: 1,
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let uploadedUrl: string | null = null;

    if (files.length > 0 && files[0]?.file) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", files[0].file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      uploadedUrl = data.url || null;
      setUploading(false);
    }

    await fetch("/api/user-pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        petId: selectedSpecies,
        image: uploadedUrl,
        allergy: form.allergy,
        specialNote: form.specialNote,
      }),
    });

    setSaving(false);
    removeFile(files[0]?.id);
    setForm({ name: "", age: "", allergy: "", specialNote: "" });
    setPreviewUrl(null);
    onSaved();
  };

  useEffect(() => {
    if (files.length > 0 && files[0]?.file) {
      const url = URL.createObjectURL(files[0].file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [files]);

  return (
    <form className="space-y-6 w-full pb-10" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Ad</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Pamuk, Fıstık, vs."
            required
          />
        </div>
        <div>
          <Label htmlFor="age">Yaş</Label>
          <Input
            id="age"
            name="age"
            value={form.age}
            onChange={handleChange}
            type="number"
            min="0"
            max="30"
            placeholder="2"
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium">Tür</Label>
        <RadioGroup
          value={selectedSpecies ?? ""}
          onValueChange={setSelectedSpecies}
          className="flex gap-4"
        >
          {speciesOptions.map((pet) => (
            <div key={pet.id} className="flex items-center gap-2">
              <RadioGroupItem id={pet.id} value={pet.id} />
              <Label htmlFor={pet.id}>{pet.name}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="allergy">Alerji</Label>
          <Input
            id="allergy"
            name="allergy"
            value={form.allergy}
            onChange={handleChange}
            placeholder="Yoksa boş bırakın"
          />
        </div>
        <div>
          <Label htmlFor="specialNote">Özel Not</Label>
          <Input
            id="specialNote"
            name="specialNote"
            value={form.specialNote}
            onChange={handleChange}
            placeholder="Ek bilgi varsa yazın"
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium">Fotoğraf</Label>
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-input data-[dragging=true]:bg-accent/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4"
        >
          <input {...getInputProps()} className="sr-only" />
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Önizleme"
                className="w-40 h-40 object-cover rounded-md"
              />
              <Button
                type="button"
                onClick={() => {
                  removeFile(files[0]?.id);
                  setPreviewUrl(null);
                }}
                size="icon"
                className="absolute -top-2 -right-2"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="mx-auto mb-2 opacity-60" />
              <p className="text-sm font-medium mb-1">
                Fotoğrafı sürükleyin veya yükleyin
              </p>
              <Button variant="outline" type="button" onClick={openFileDialog}>
                <UploadIcon className="-ms-1 opacity-60 mr-1" />
                Fotoğraf Seç
              </Button>
            </div>
          )}
        </div>
        {errors.length > 0 && (
          <div className="text-destructive flex items-center gap-1 text-xs mt-2">
            <AlertCircleIcon className="size-3 shrink-0" />
            <span>{errors[0]}</span>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-6">
        <Button variant="outline" type="button" onClick={onSaved}>
          İptal
        </Button>
        <Button type="submit" disabled={saving || uploading}>
          {saving || uploading ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
