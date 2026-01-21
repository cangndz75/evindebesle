"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CompanySettingsClient() {
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("99");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/company-settings");
        if (res.ok) {
          const data = await res.json();
          setFreeShippingThreshold(data.freeShippingThreshold?.toString() || "99");
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Ayarlar yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Ayarları kaydet
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const threshold = parseFloat(freeShippingThreshold);
      
      if (isNaN(threshold) || threshold < 0) {
        toast.error("Geçerli bir fiyat girin");
        return;
      }

      const res = await fetch("/api/company-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeShippingThreshold: threshold }),
      });

      if (res.ok) {
        toast.success("Ayarlar kaydedildi");
      } else {
        toast.error("Ayarlar kaydedilirken bir hata oluştu");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Ayarlar kaydedilirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-light mb-8">Firma Yönetimi</h1>

      <div className="space-y-6">
        {/* Ücretsiz Kargo Fiyatı */}
        <div className="space-y-2">
          <Label htmlFor="freeShippingThreshold" className="text-base font-medium">
            Ücretsiz Kargo Fiyatı (₺)
          </Label>
          <p className="text-sm text-gray-600">
            Sepet toplamı bu tutara ulaştığında ücretsiz kargo uygulanır.
          </p>
          <Input
            id="freeShippingThreshold"
            type="number"
            step="0.01"
            min="0"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
            className="max-w-xs"
            placeholder="99.00"
          />
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#111] text-white hover:bg-[#333]"
          >
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
