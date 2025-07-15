"use client";

import { useEffect, useState } from "react";
import { PencilIcon, Trash2, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AddressForm from "./AddressForm";

type District = { id: string; name: string };
type UserAddress = { districtId?: string; fullAddress?: string };

export default function AddressList() {
  const [userAddress, setUserAddress] = useState<UserAddress | null>(null);
  const [districtName, setDistrictName] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    fetch("/api/districts")
      .then((res) => res.json())
      .then(setDistricts);
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.districtId || data.fullAddress) {
          setUserAddress({
            districtId: data.districtId,
            fullAddress: data.fullAddress,
          });

          const found = districts.find((d) => d.id === data.districtId);
          if (found) setDistrictName(found.name);
        } else {
          setUserAddress(null);
        }
      });
  }, [districts]);

  const handleSave = async (values: {
    districtId: string;
    fullAddress: string;
  }) => {
    setLoading(true);
    const res = await fetch("/api/address", {
      method: "PATCH",
      body: JSON.stringify(values),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      setUserAddress(values);
      const selectedDistrict = districts.find(
        (d) => d.id === values.districtId
      );
      if (selectedDistrict) setDistrictName(selectedDistrict.name);
      setOpen(false);
    } else {
      console.error("Hata oluştu");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    await fetch("/api/address", { method: "DELETE" });
    setUserAddress(null);
    setDistrictName("");
  };

  return (
    <div>
      {userAddress ? (
        <div className="border rounded-lg p-4 flex items-start justify-between">
          <div>
            <div className="text-sm text-gray-500">İlçe:</div>
            <div className="font-medium text-lg">{districtName || "-"}</div>
            <div className="mt-2 text-sm text-gray-500">Adres:</div>
            <div>{userAddress.fullAddress || "-"}</div>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" onClick={() => setOpen(true)}>
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between border rounded-lg p-4">
          <span className="text-sm text-gray-600">
            Henüz bir adres eklemediniz.
          </span>
          <Button onClick={() => setOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Adres Ekle
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userAddress ? "Adres Bilgilerini Güncelle" : "Yeni Adres Ekle"}
            </DialogTitle>
          </DialogHeader>
          <AddressForm
            districtId={userAddress?.districtId}
            fullAddress={userAddress?.fullAddress}
            loading={loading}
            onSubmit={handleSave}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
