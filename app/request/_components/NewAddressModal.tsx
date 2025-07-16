"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DistrictSelect from "./DistrictSelect";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: (data: { districtId: string; fullAddress: string }) => void;
};

export default function NewAddressModal({ open, onClose, onSaved }: Props) {
  const [districtId, setDistrictId] = useState<string>("");
  const [fullAddress, setFullAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!districtId || !fullAddress.trim()) {
      toast.error("Tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ districtId, fullAddress }),
      });

      if (!res.ok) throw new Error("Sunucu hatası");

      toast.success("Adres güncellendi.");

      if (onSaved) {
        onSaved({ districtId, fullAddress });
      }

      onClose();
    } catch (error) {
      toast.error("Adres kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setDistrictId("");
      setFullAddress("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Adres Ekle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="mb-1 block">İlçe Seçimi</Label>
            <DistrictSelect onSelect={setDistrictId} />
          </div>

          <div>
            <Label className="mb-1 block">Detaylı Adres</Label>
            <Input
              placeholder="Apartman, sokak, no, kat vb."
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">İptal</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
