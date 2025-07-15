"use client";
import { useState, useEffect } from "react";

type District = { id: string; name: string; };

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

  useEffect(() => {
    fetch("/api/districts")
      .then(res => res.json())
      .then(setDistricts);
  }, []);

  const [selectedDistrict, setSelectedDistrict] = useState(districtId ?? "");
  const [address, setAddress] = useState(fullAddress ?? "");

  return (
    <form
      className="space-y-4"
      onSubmit={e => {
        e.preventDefault();
        onSubmit({ districtId: selectedDistrict, fullAddress: address });
      }}
    >
      <div>
        <label className="block mb-1 text-sm font-medium">İlçe</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={selectedDistrict}
          onChange={e => setSelectedDistrict(e.target.value)}
          required
        >
          <option value="">İlçe Seçiniz</option>
          {districts.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Adres Detayı</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Açık adresinizi girin"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 rounded bg-black text-white font-medium"
        disabled={loading}
      >
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
