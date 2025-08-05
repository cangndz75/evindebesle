"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Prop tipi güncellendi: districtId ve fullAddress isteğe bağlı oldu
interface AddressFormProps {
  districtId?: string;
  fullAddress?: string;
  onSubmit: (values: { districtId: string; fullAddress: string }) => void;
  loading: boolean;
}

type District = { id: string; name: string };

export default function AddressForm({
  districtId,
  fullAddress,
  onSubmit,
  loading,
}: AddressFormProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState(districtId || "");
  const [address, setAddress] = useState(fullAddress || "");

  useEffect(() => {
    setSelectedDistrict(districtId || "");
    setAddress(fullAddress || "");
  }, [districtId, fullAddress]);

  // İlçeleri getir
  useEffect(() => {
    fetch("/api/districts")
      .then((res) => res.json())
      .then(setDistricts);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrict || !address) return;
    onSubmit({ districtId: selectedDistrict, fullAddress: address });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label>İlçe</Label>
        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="İlçe Seçiniz" />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Adres Detayı</Label>
        <Input
          placeholder="Açık adresinizi girin"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <svg
            className="animate-spin h-5 w-5 mx-auto text-white"
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
        ) : districtId ? (
          "Güncelle"
        ) : (
          "Kaydet"
        )}
      </Button>
    </form>
  );
}
