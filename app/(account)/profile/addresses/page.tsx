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
import { Skeleton } from "@/components/ui/skeleton";
import AddressForm from "./AddressForm";
import EditAddressForm from "./EditAddressModal";

type District = { id: string; name: string };
type Address = {
  id: string;
  districtId: string;
  districtName: string;
  fullAddress: string;
  isPrimary: boolean;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
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

  const handleAdd = async (values: {
    districtId: string;
    fullAddress: string;
  }) => {
    setFormLoading(true);
    const res = await fetch("/api/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      await fetchAddresses();
      setOpenAdd(false);
    }
    setFormLoading(false);
  };

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
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Adreslerim</h1>
        <Button onClick={() => setOpenAdd(true)}>
          <PlusCircle className="w-4 h-4 mr-2" /> Yeni Adres Ekle
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-full" />
        </div>
      ) : addresses.length > 0 ? (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="border rounded-lg p-4 flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              {/* SOL BLOK */}
              <div className="flex-1">
                <div className="text-sm text-gray-500">İlçe:</div>
                <div className="font-medium text-lg">
                  {address.districtName}
                </div>
                <div className="mt-2 text-sm text-gray-500">Tam Adres:</div>
                <div>{address.fullAddress}</div>
                {address.isPrimary && (
                  <div className="text-xs text-green-600 mt-2 font-medium">
                    ⭐ Ana Adres
                  </div>
                )}
              </div>

              {/* SAĞ BUTONLAR */}
              <div className="flex flex-col items-end gap-2 min-w-[120px]">
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

                {!address.isPrimary && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 px-0 hover:underline"
                    onClick={async () => {
                      await fetch(`/api/address/${address.id}/primary`, {
                        method: "PATCH",
                      });
                      await fetchAddresses();
                    }}
                  >
                    ⭐ Ana Adres Yap
                  </Button>
                )}
              </div>

              {/* GÜNCELLEME DİALOGU */}
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
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Henüz bir adres eklemediniz.</p>
      )}

      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Adres Ekle</DialogTitle>
          </DialogHeader>
          <AddressForm loading={formLoading} onSubmit={handleAdd} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
