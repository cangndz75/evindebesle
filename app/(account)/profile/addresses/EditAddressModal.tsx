"use client";

import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { turkeyData } from "@/lib/data/turkey-cities";
import { MapPin } from "lucide-react";

export default function EditAddressForm({
  city,
  district,
  fullAddress,
  onSubmit,
  loading,
}: {
  city?: string;
  district?: string;
  fullAddress?: string;
  onSubmit: (values: { city: string; district: string; fullAddress: string }) => void;
  loading: boolean;
}) {
  const [selectedCity, setSelectedCity] = useState(city ?? "");
  const [selectedDistrict, setSelectedDistrict] = useState(district ?? "");
  const [address, setAddress] = useState(fullAddress ?? "");

  useEffect(() => {
    setSelectedCity(city ?? "");
    setSelectedDistrict(district ?? "");
    setAddress(fullAddress ?? "");
  }, [city, district, fullAddress]);

  const districts = useMemo(() => {
    const found = turkeyData.find((c) => c.name === selectedCity);
    return found?.districts || [];
  }, [selectedCity]);

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    setSelectedDistrict("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity || !selectedDistrict || !address.trim()) return;
    onSubmit({ city: selectedCity, district: selectedDistrict, fullAddress: address.trim() });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 pb-2 border-b">
        <MapPin className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Adres bilgilerini düzenleyin</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">İl</Label>
          <Select value={selectedCity} onValueChange={handleCityChange}>
            <SelectTrigger className="w-full h-11">
              <SelectValue placeholder="İl Seçiniz" />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              {turkeyData.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">İlçe</Label>
          <Select
            value={selectedDistrict}
            onValueChange={setSelectedDistrict}
            disabled={!selectedCity}
          >
            <SelectTrigger className="w-full h-11">
              <SelectValue placeholder={selectedCity ? "İlçe Seçiniz" : "Önce il seçin"} />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Adres Detayı</Label>
        <Textarea
          placeholder="Mahalle, sokak, bina no, daire no, vb."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11"
        disabled={loading || !selectedCity || !selectedDistrict || !address.trim()}
      >
        {loading ? "Güncelleniyor..." : "Güncelle"}
      </Button>
    </form>
  );
}
