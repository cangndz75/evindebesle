"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { XIcon, ImageIcon, UploadIcon, AlertCircleIcon } from "lucide-react";

import { useFileUpload } from "@/hooks/use-file-upload";

type Props = {
  onSaved: () => void;
};

export default function PetAddForm({ onSaved }: Props) {
  const id = useId();
  const [species, setSpecies] = useState("kedi");

  const speciesOptions = [
    { value: "kedi", label: "Kedi" },
    { value: "köpek", label: "Köpek" },
    { value: "kuş", label: "Kuş" },
  ];

  const maxSizeMB = 5;
  const maxSize = maxSizeMB * 1024 * 1024;
  const maxFiles = 6;

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
    multiple: true,
    maxFiles,
  });

  return (
    <form
      className="space-y-6 w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onSaved();
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ad</Label>
          <Input placeholder="Pamuk, Fıstık,..." required />
        </div>
        <div>
          <Label>Yaş</Label>
          <Input type="number" placeholder="2" />
        </div>
      </div>

      <div>
        <Label className="block mb-2 text-sm font-medium">Tür</Label>
        <RadioGroup
          className="flex gap-4"
          defaultValue={species}
          onValueChange={setSpecies}
        >
          {speciesOptions.map((item) => (
            <div
              key={`${id}-${item.value}`}
              className="border-input has-data-[state=checked]:border-primary/50 relative flex flex-col items-start gap-4 rounded-md border p-3 shadow-xs outline-none"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  id={`${id}-${item.value}`}
                  value={item.value}
                  className="after:absolute after:inset-0"
                />
                <Label htmlFor={`${id}-${item.value}`}>{item.label}</Label>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* <div>
          <Label>Aile İlişkisi</Label>
          <Input placeholder="Örn: Kardeşi" />
        </div> */}
        <div>
          <Label>Alerji</Label>
          <Input placeholder="Yoksa boş bırakın" />
        </div>
        <div>
          <Label>Özel Not</Label>
          <Input placeholder="Ek bilgi varsa yazın" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* <div>
          <Label>Hassasiyet</Label>
          <Input placeholder="Tırnak kesiminde huzursuz olur" />
        </div> */}
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium">Resimler</Label>
        <div className="border border-dashed rounded-md p-6 text-center">
          <p className="text-sm text-gray-500">Görsel alanı buraya</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-6">
        <Button variant="outline" type="button">
          İptal
        </Button>
        <Button type="submit">Kaydet</Button>
      </div>
    </form>
  );
}
