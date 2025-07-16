"use client";

import { useEffect, useState } from "react";
import { PencilIcon, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EditAddressForm from "./EditAddressModal";

type District = { id: string; name: string };
type Address = {
  id: string;
  districtId: string;
  districtName: string;
  fullAddress: string;
  isPrimary: boolean;
};

export default function AddressList() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [openEditId, setOpenEditId] = useState<string | null>(null);

  const fetchAddresses = async () => {
    const res = await fetch("/api/address");
    const data = await res.json();
    setAddresses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/districts")
      .then((res) => res.json())
      .then(setDistricts);
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleEdit = async (
    id: string,
    values: { districtId: string; fullAddress: string }
  ) => {
    setFormLoading(true);
    const res = await fetch(`/api/address/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      await fetchAddresses();
      setOpenEditId(null);
    }

    setFormLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu adresi silmek istediğinize emin misiniz?")) return;

    await fetch(`/api/address/${id}`, { method: "DELETE" });
    await fetchAddresses();
  };

  return (
    <div className="space-y-4">
      {loading ? (
        [...Array(2)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))
      ) : addresses.length > 0 ? (
        addresses.map((address) => (
          <div
            key={address.id}
            className="border rounded-lg p-4 flex items-start justify-between"
          >
            <div>
              <div className="text-sm text-gray-500">İlçe:</div>
              <div className="font-medium text-lg">{address.districtName}</div>
              <div className="mt-2 text-sm text-gray-500">Tam Adres:</div>
              <div>{address.fullAddress}</div>
              {address.isPrimary && (
                <div className="text-xs text-green-600 mt-2">⭐ Ana Adres</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setOpenEditId(address.id)}
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => handleDelete(address.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <Dialog
              open={openEditId === address.id}
              onOpenChange={() => setOpenEditId(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adresi Güncelle</DialogTitle>
                </DialogHeader>
                <EditAddressForm
                  districtId={address.districtId}
                  fullAddress={address.fullAddress}
                  loading={formLoading}
                  onSubmit={(values) => handleEdit(address.id, values)}
                />
              </DialogContent>
            </Dialog>
          </div>
        ))
      ) : (
        <div className="text-gray-500 text-sm">
          Henüz bir adres eklemediniz.
        </div>
      )}
    </div>
  );
}
