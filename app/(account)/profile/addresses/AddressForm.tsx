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

type District = { id: string; name: string };

export default function AddressForm({
  districtId,
  fullAddress,
  onSubmit,
  loading,
}: {
  districtId?: string;
  fullAddress?: string;
  onSubmit: (values: { districtId: string; fullAddress: string }) => void;
  loading: boolean;
}) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState(districtId ?? "");
  const [address, setAddress] = useState(fullAddress ?? "");

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
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
