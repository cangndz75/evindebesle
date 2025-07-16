"use client";

import { useEffect, useState } from "react";

type Props = {
  value: string;
  onSelect: (id: string) => void;
};

type District = {
  id: string;
  name: string;
};

export default function DistrictSelect({ value, onSelect }: Props) {
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    fetch("/api/districts")
      .then((res) => res.json())
      .then(setDistricts);
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full border rounded px-3 py-2"
    >
      <option value="">Bir ilçe seçin</option>
      {districts.map((district) => (
        <option key={district.id} value={district.id}>
          {district.name}
        </option>
      ))}
    </select>
  );
}
