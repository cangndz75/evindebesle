"use client";

import { useEffect, useState } from "react";
import AddressForm from "./AddressForm";

type District = { id: string; name: string };

export default function AddressEdit({ onSuccess }: { onSuccess: () => void }) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [userAddress, setUserAddress] = useState<{ districtId?: string; fullAddress?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/districts")
      .then((res) => res.json())
      .then(setDistricts);
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) =>
        setUserAddress({
          districtId: data.districtId,
          fullAddress: data.fullAddress,
        })
      );
  }, []);

  const handleSave = async (values: { districtId: string; fullAddress: string }) => {
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
      districtId={userAddress.districtId}
      fullAddress={userAddress.fullAddress}
      loading={loading}
      onSubmit={handleSave}
    />
  );
}
