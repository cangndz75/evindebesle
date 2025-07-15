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
  const [cloudinaryUrls, setCloudinaryUrls] = useState<string[]>([]);

  const maxSizeMB = 5;
  const maxSize = maxSizeMB * 1024 * 1024;
  const maxFiles = 6;

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

  const uploadAllToCloudinary = async () => {
    setUploading(true);
    const f = files[0];
    if (!f?.file) return [];

    const formData = new FormData();
    formData.append("file", f.file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);
    const url = data.url;
    if (url) setCloudinaryUrls([url]);
    return url ? [url] : [];
  };

  if (
    files.length > 0 &&
    cloudinaryUrls.length !== files.length &&
    !uploading
  ) {
    uploadAllToCloudinary();
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const uploadedUrls = await uploadAllToCloudinary();
    const image = uploadedUrls[0] || null;

    await fetch("/api/user-pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        petId: selectedSpecies,
        image: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        allergy: form.allergy,
        specialNote: form.specialNote,
      }),
    });

    setSaving(false);
    setCloudinaryUrls([]);
    files.forEach((f) => removeFile(f.id));
    setForm({ name: "", age: "", allergy: "", specialNote: "" });
    onSaved();
  };

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
        <Label className="mb-2 block text-sm font-medium">Fotoğraflar</Label>
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          data-files={files.length > 0 || undefined}
          className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:ring-[3px]"
        >
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label="Upload image file"
          />
          {cloudinaryUrls.length > 0 ? (
            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-medium">
                  Yüklenen Fotoğraflar ({cloudinaryUrls.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openFileDialog}
                  disabled={files.length >= maxFiles}
                >
                  <UploadIcon className="-ms-0.5 size-3.5 opacity-60" />
                  Daha fazla ekle
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {cloudinaryUrls.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-accent relative aspect-square rounded-md">
                      <img
                        src={cloudinaryUrls[0]}
                        alt="Yüklenen fotoğraf"
                        className="size-full rounded-[inherit] object-cover"
                      />
                      <Button
                        onClick={() => {
                          if (files[0]) removeFile(files[0].id);
                          setCloudinaryUrls([]);
                        }}
                        size="icon"
                        className="border-background focus-visible:border-background absolute -top-2 -right-2 size-6 rounded-full border-2 shadow-none"
                        aria-label="Remove image"
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div className="bg-background mb-2 flex size-11 items-center justify-center rounded-full border">
                <ImageIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">
                Fotoğrafları buraya sürükle veya yükle
              </p>
              <p className="text-muted-foreground text-xs">
                PNG, JPG veya GIF (max. {maxSizeMB}MB)
              </p>
              <Button
                variant="outline"
                className="mt-4"
                type="button"
                onClick={openFileDialog}
              >
                <UploadIcon className="-ms-1 opacity-60" />
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
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
      <div className="h-12" />
    </form>
  );
}
