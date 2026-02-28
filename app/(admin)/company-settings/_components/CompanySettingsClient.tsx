"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface CompanySettings {
  freeShippingThreshold: number;
  shippingPrice: number;
  companyName?: string | null;
  companyAddress?: string | null;
  taxOffice?: string | null;
  taxNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  website?: string | null;
}

export default function CompanySettingsClient() {
  const [settings, setSettings] = useState<CompanySettings>({
    freeShippingThreshold: 99,
    shippingPrice: 49.90,
    companyName: "Evindebesle",
    companyAddress: "",
    taxOffice: "",
    taxNumber: "",
    phone: "",
    email: "",
    logoUrl: "",
    website: "",
  });
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
          setSettings({
            freeShippingThreshold: data.freeShippingThreshold || 99,
            shippingPrice: data.shippingPrice || 49.90,
            companyName: data.companyName || "Evindebesle",
            companyAddress: data.companyAddress || "",
            taxOffice: data.taxOffice || "",
            taxNumber: data.taxNumber || "",
            phone: data.phone || "",
            email: data.email || "",
            logoUrl: data.logoUrl || "",
            website: data.website || "",
          });
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

      if (isNaN(settings.freeShippingThreshold) || settings.freeShippingThreshold < 0) {
        toast.error("Geçerli bir fiyat girin");
        return;
      }

      const res = await fetch("/api/company-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
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

  const handleChange = (field: keyof CompanySettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
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
      <h1 className="text-3xl font-light mb-2">Firma Ayarları</h1>
      <p className="text-gray-600 mb-8">Şirket bilgilerinizi ve genel ayarlarınızı yönetin</p>

      <div className="space-y-8">
        {/* Genel Ayarlar */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Genel Ayarlar</h2>
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
              value={settings.freeShippingThreshold}
              onChange={(e) => handleChange("freeShippingThreshold", parseFloat(e.target.value))}
              className="max-w-xs"
              placeholder="99.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shippingPrice" className="text-base font-medium">
              Kargo Ücreti (₺)
            </Label>
            <p className="text-sm text-gray-600">
              Ücretsiz kargo eşiğinin altındaki siparişlere uygulanacak kargo ücreti.
            </p>
            <Input
              id="shippingPrice"
              type="number"
              step="0.01"
              min="0"
              value={settings.shippingPrice}
              onChange={(e) => handleChange("shippingPrice", parseFloat(e.target.value))}
              className="max-w-xs"
              placeholder="49.90"
            />
          </div>
        </div>

        <Separator />

        {/* Fatura Bilgileri */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Fatura Bilgileri</h2>
            <p className="text-sm text-gray-600 mt-1">Bu bilgiler PDF faturalarında görünecektir</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Şirket Ünvanı */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Şirket Ünvanı</Label>
              <Input
                id="companyName"
                value={settings.companyName || ""}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="Evindebesle"
              />
            </div>

            {/* Telefon */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={settings.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+90 (212) 123 45 67"
              />
            </div>

            {/* E-posta */}
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={settings.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="info@dark-velvet.com"
              />
            </div>

            {/* Web Sitesi */}
            <div className="space-y-2">
              <Label htmlFor="website">Web Sitesi</Label>
              <Input
                id="website"
                type="url"
                value={settings.website || ""}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="www.evindebesle.com"
              />
            </div>

            {/* Vergi Dairesi */}
            <div className="space-y-2">
              <Label htmlFor="taxOffice">Vergi Dairesi</Label>
              <Input
                id="taxOffice"
                value={settings.taxOffice || ""}
                onChange={(e) => handleChange("taxOffice", e.target.value)}
                placeholder="Kadıköy Vergi Dairesi"
              />
            </div>

            {/* Vergi Numarası */}
            <div className="space-y-2">
              <Label htmlFor="taxNumber">Vergi Numarası</Label>
              <Input
                id="taxNumber"
                value={settings.taxNumber || ""}
                onChange={(e) => handleChange("taxNumber", e.target.value)}
                placeholder="1234567890"
              />
            </div>
          </div>

          {/* Adres */}
          <div className="space-y-2">
            <Label htmlFor="companyAddress">Şirket Adresi</Label>
            <Textarea
              id="companyAddress"
              value={settings.companyAddress || ""}
              onChange={(e) => handleChange("companyAddress", e.target.value)}
              placeholder="Mahalle, Sokak, No:, İlçe/İl"
              rows={3}
            />
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <p className="text-sm text-gray-600">
              Faturada görünecek logo görselinin URL'si
            </p>
            <Input
              id="logoUrl"
              type="url"
              value={settings.logoUrl || ""}
              onChange={(e) => handleChange("logoUrl", e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            {settings.logoUrl && (
              <div className="mt-2">
                <img
                  src={settings.logoUrl}
                  alt="Logo önizleme"
                  className="max-w-xs h-auto border rounded p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Kaydet Butonu */}
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
