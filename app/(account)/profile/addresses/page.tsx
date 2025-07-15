"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddressForm from "./AddressForm";
import AddressList from "./AddressList";

export default function AddressesPage() {
  const [addressExists, setAddressExists] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.districtId || data?.fullAddress) setAddressExists(true);
      });
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Adreslerim</h1>
        {!addressExists && (
          <Button onClick={() => setOpen(true)}>+ Adres Ekle</Button>
        )}
      </div>

      {addressExists ? (
        <AddressList />
      ) : (
        <p className="text-gray-500">Lütfen adresinizi ekleyin.</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adres Ekle</DialogTitle>
          </DialogHeader>
          <AddressForm
            onSubmit={async (values) => {
              await fetch("/api/address", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
              });
              setAddressExists(true);
              setOpen(false);
            }}
            loading={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
