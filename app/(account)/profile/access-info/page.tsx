"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import AccessInfoForm, { AccessInfo } from "./_components/AccessInfoForm";

export default function AccessInfoPage() {
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInfo = async () => {
    try {
      const res = await fetch("/api/access-info");
      if (!res.ok) return setAccessInfo(null);
      const data = await res.json();
      setAccessInfo(data || null);
    } catch {
      setAccessInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Erişim Bilgilerim</h1>
        <Button onClick={() => setOpen(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          {accessInfo ? "Düzenle" : "Ekle"}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Yükleniyor...</p>
      ) : accessInfo ? (
        <div className="border rounded-lg p-4 space-y-3 text-sm">
          <div>
            <strong>Anahtar:</strong> {accessInfo.keyLocation}
          </div>
          {accessInfo.keyInstruction && (
            <div>
              <strong>Açıklama:</strong> {accessInfo.keyInstruction}
            </div>
          )}
          {accessInfo.doorPassword && (
            <div>
              <strong>Kapı Şifresi:</strong> {accessInfo.doorPassword}
            </div>
          )}
          {accessInfo.doorNote && (
            <div>
              <strong>Kapı Notu:</strong> {accessInfo.doorNote}
            </div>
          )}
          {accessInfo.alarmExists && (
            <div>
              <strong>Alarm:</strong> Var (
              {accessInfo.alarmRoom || "Oda belirtilmemiş"})
            </div>
          )}
          {accessInfo.keyPhotoUrl && (
            <div>
              <strong>Fotoğraf:</strong>
              <img
                src={accessInfo.keyPhotoUrl}
                alt="Anahtar Foto"
                className="w-32 mt-2 rounded border"
              />
            </div>
          )}
          {accessInfo.accessNote && (
            <div>
              <strong>Genel Not:</strong> {accessInfo.accessNote}
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">
          Herhangi bir erişim bilginiz yok.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {accessInfo ? "Bilgiyi Düzenle" : "Yeni Erişim Bilgisi Ekle"}
            </DialogTitle>
          </DialogHeader>
          <AccessInfoForm
            defaultData={accessInfo ?? undefined}
            onSaved={() => {
              setOpen(false);
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
