"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  value: string;
  onFileSelect: (file: File) => void;
};

export default function ImageUpload({ value, onFileSelect }: Props) {
  return (
    <div className="space-y-2">
      {value && (
        <img
          src={value}
          alt="Yüklenen görsel"
          className="w-40 h-40 object-cover rounded border"
        />
      )}
      <Label>Fotoğraf Yükle</Label>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
    </div>
  );
}
