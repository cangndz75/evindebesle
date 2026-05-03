"use client";

import { useEffect, useState } from "react";
import AddressForm from "./AddressForm";

export default function AddressEdit({ onSuccess }: { onSuccess: () => void }) {
  const [userAddress, setUserAddress] = useState<{ city?: string; district?: string; fullAddress?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) =>
        setUserAddress({
          city: data.city,
          district: data.district,
          fullAddress: data.fullAddress,
        })
      );
  }, []);

  const handleSave = async (values: { city: string; district: string; fullAddress: string }) => {
    setLoading(true);
    await fetch("/api/address", {
      method: "PATCH",
      body: JSON.stringify(values),
      headers: { "Content-Type": "application/json" },
    });
    setLoading(false);
    onSuccess();
  };

  return (
    <AddressForm
      city={userAddress.city}
      district={userAddress.district}
      fullAddress={userAddress.fullAddress}
      loading={loading}
      onSubmit={handleSave}
    />
  );
}
