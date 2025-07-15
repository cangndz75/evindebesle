"use client";
import { useState } from "react";
import { toast } from "sonner";
import AddressForm from "./AddressForm";

export default function AddressEdit({ districtId, fullAddress }: { districtId?: string, fullAddress?: string }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { districtId: string; fullAddress: string }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/address", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      toast.success("Adresiniz güncellendi!");
    } catch {
      toast.error("Adres güncellenemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4">Adresim</h2>
      <AddressForm
        districtId={districtId}
        fullAddress={fullAddress}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
}
