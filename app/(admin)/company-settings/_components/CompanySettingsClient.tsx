"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  deliveryTimes?: DeliveryTime[];
  announcementMessages?: string[];
}

type DeliveryTime = {
  title: string;
  time: string;
  note: string;
};

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
};

type FAQDraft = {
  question: string;
  answer: string;
};

const faqCategories = [
  { value: "order", label: "Sipariş" },
  { value: "payment", label: "Ödeme" },
  { value: "shipping", label: "Kargo" },
  { value: "return", label: "İade" },
  { value: "product", label: "Ürün" },
  { value: "account", label: "Hesap" },
];

export default function CompanySettingsClient() {
  const [settings, setSettings] = useState<CompanySettings>({
    freeShippingThreshold: 99,
    shippingPrice: 49.90,
    companyName: "Dark Velvet",
    companyAddress: "",
    taxOffice: "",
    taxNumber: "",
    phone: "",
    email: "",
    logoUrl: "",
    website: "",
    announcementMessages: [],
    deliveryTimes: [
      {
        title: "İstanbul İçi",
        time: "1-2 iş günü",
        note: "Saat 14:00'e kadar verilen siparişler aynı gün kargoya verilir.",
      },
      {
        title: "Büyükşehirler",
        time: "2-3 iş günü",
        note: "Ankara, İzmir, Bursa, Antalya ve diğer büyükşehirler.",
      },
      {
        title: "Diğer İller",
        time: "3-5 iş günü",
        note: "Kırsal bölgelerde teslimat süreleri uzayabilir.",
      },
    ],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqSaving, setFaqSaving] = useState(false);
  const [faqList, setFaqList] = useState<FAQItem[]>([]);
  const [faqCategory, setFaqCategory] = useState("order");
  const [faqDrafts, setFaqDrafts] = useState<FAQDraft[]>([{ question: "", answer: "" }]);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

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
            companyName: data.companyName || "Dark Velvet",
            companyAddress: data.companyAddress || "",
            taxOffice: data.taxOffice || "",
            taxNumber: data.taxNumber || "",
            phone: data.phone || "",
            email: data.email || "",
            logoUrl: data.logoUrl || "",
            website: data.website || "",
            announcementMessages: Array.isArray(data.announcementMessages)
              ? data.announcementMessages.filter((item: unknown): item is string => typeof item === "string")
              : [],
            deliveryTimes: Array.isArray(data.deliveryTimes) && data.deliveryTimes.length > 0
              ? data.deliveryTimes
              : [
                  {
                    title: "İstanbul İçi",
                    time: "1-2 iş günü",
                    note: "Saat 14:00'e kadar verilen siparişler aynı gün kargoya verilir.",
                  },
                  {
                    title: "Büyükşehirler",
                    time: "2-3 iş günü",
                    note: "Ankara, İzmir, Bursa, Antalya ve diğer büyükşehirler.",
                  },
                  {
                    title: "Diğer İller",
                    time: "3-5 iş günü",
                    note: "Kırsal bölgelerde teslimat süreleri uzayabilir.",
                  },
                ],
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

  const loadFaqs = async () => {
    try {
      setFaqLoading(true);
      const res = await fetch("/api/admin/faq?admin=true");
      if (!res.ok) {
        toast.error("SSS listesi alınamadı");
        return;
      }
      const data = await res.json();
      setFaqList(data.faqs || []);
    } catch {
      toast.error("SSS listesi alınamadı");
    } finally {
      setFaqLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

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

  const updateDeliveryTime = (index: number, field: keyof DeliveryTime, value: string) => {
    setSettings((prev) => {
      const current = Array.isArray(prev.deliveryTimes) ? prev.deliveryTimes : [];
      return {
        ...prev,
        deliveryTimes: current.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      };
    });
  };

  const updateAnnouncementMessage = (index: number, value: string) => {
    setSettings((prev) => {
      const current = Array.isArray(prev.announcementMessages) ? prev.announcementMessages : [];
      return {
        ...prev,
        announcementMessages: current.map((item, i) => (i === index ? value : item)),
      };
    });
  };

  const addAnnouncementMessage = () => {
    setSettings((prev) => {
      const current = Array.isArray(prev.announcementMessages) ? prev.announcementMessages : [];
      return {
        ...prev,
        announcementMessages: [...current, ""],
      };
    });
  };

  const removeAnnouncementMessage = (index: number) => {
    setSettings((prev) => {
      const current = Array.isArray(prev.announcementMessages) ? prev.announcementMessages : [];
      return {
        ...prev,
        announcementMessages: current.filter((_, i) => i !== index),
      };
    });
  };

  const addDeliveryTime = () => {
    setSettings((prev) => {
      const current = Array.isArray(prev.deliveryTimes) ? prev.deliveryTimes : [];
      return {
        ...prev,
        deliveryTimes: [...current, { title: "", time: "", note: "" }],
      };
    });
  };

  const removeDeliveryTime = (index: number) => {
    setSettings((prev) => {
      const current = Array.isArray(prev.deliveryTimes) ? prev.deliveryTimes : [];
      if (current.length <= 1) return prev;
      return {
        ...prev,
        deliveryTimes: current.filter((_, i) => i !== index),
      };
    });
  };

  const updateDraft = (index: number, field: keyof FAQDraft, value: string) => {
    setFaqDrafts((prev) => prev.map((draft, i) => (i === index ? { ...draft, [field]: value } : draft)));
  };

  const addDraft = () => {
    setFaqDrafts((prev) => [...prev, { question: "", answer: "" }]);
  };

  const removeDraft = (index: number) => {
    setFaqDrafts((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const resetDrafts = () => {
    setFaqDrafts([{ question: "", answer: "" }]);
    setEditingFaqId(null);
  };

  const saveFaqs = async () => {
    const validItems = faqDrafts
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      }))
      .filter((item) => item.question && item.answer);

    if (validItems.length === 0) {
      toast.error("En az bir soru ve cevap girin");
      return;
    }

    try {
      setFaqSaving(true);
      const isEditMode = Boolean(editingFaqId);
      const res = await fetch("/api/admin/faq", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: isEditMode
          ? JSON.stringify({
              id: editingFaqId,
              category: faqCategory,
              question: validItems[0].question,
              answer: validItems[0].answer,
            })
          : JSON.stringify({
              category: faqCategory,
              isActive: true,
              items: validItems,
            }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "SSS kayıtları eklenemedi");
        return;
      }

      await loadFaqs();
      resetDrafts();
      toast.success(isEditMode ? "SSS kaydı güncellendi" : "SSS kayıtları eklendi");
    } catch {
      toast.error("SSS kayıtları eklenemedi");
    } finally {
      setFaqSaving(false);
    }
  };

  const startEditFaq = (faq: FAQItem) => {
    setEditingFaqId(faq.id);
    setFaqCategory(faq.category);
    setFaqDrafts([{ question: faq.question, answer: faq.answer }]);
  };

  const toggleFaqActive = async (faq: FAQItem, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faq.id, isActive }),
      });

      if (!res.ok) {
        toast.error("Durum güncellenemedi");
        return;
      }

      setFaqList((prev) => prev.map((item) => (item.id === faq.id ? { ...item, isActive } : item)));
      toast.success("SSS durumu güncellendi");
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };

  const deleteFaq = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/faq?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("SSS silinemedi");
        return;
      }

      setFaqList((prev) => prev.filter((item) => item.id !== id));
      if (editingFaqId === id) {
        resetDrafts();
      }
      toast.success("SSS silindi");
    } catch {
      toast.error("SSS silinemedi");
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
      <h1 className="text-3xl font-light mb-2">Firma Ayarları</h1>
      <p className="text-gray-600 mb-8">Şirket bilgilerinizi ve genel ayarlarınızı yönetin</p>

      <div className="space-y-8">
        
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

          <div className="space-y-3">
            <Label className="text-base font-medium">Üst Bant Kampanya Metinleri</Label>
            <p className="text-sm text-gray-600">
              Ana sayfanın en üstündeki bantta bu metinler sırayla gösterilir. "Ücretsiz Kargo" metni her zaman ilk sırada kalır.
            </p>

            <div className="space-y-3">
              {(settings.announcementMessages || []).map((message, index) => (
                <div key={index} className="rounded-lg border p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Kampanya Metni {index + 1}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAnnouncementMessage(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Sil
                    </Button>
                  </div>
                  <Textarea
                    value={message}
                    onChange={(e) => updateAnnouncementMessage(index, e.target.value)}
                    placeholder="Örn: Yeni üyelere özel %10 indirim"
                    rows={2}
                  />
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addAnnouncementMessage}>
                <Plus className="w-4 h-4 mr-2" />
                Kampanya Metni Ekle
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Fatura Bilgileri</h2>
            <p className="text-sm text-gray-600 mt-1">Bu bilgiler PDF faturalarında görünecektir</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <Label htmlFor="companyName">Şirket Ünvanı</Label>
              <Input
                id="companyName"
                value={settings.companyName || ""}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="Dark Velvet"
              />
            </div>

            
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

            
            <div className="space-y-2">
              <Label htmlFor="website">Web Sitesi</Label>
              <Input
                id="website"
                type="url"
                value={settings.website || ""}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="dark-velvet.com"
              />
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="taxOffice">Vergi Dairesi</Label>
              <Input
                id="taxOffice"
                value={settings.taxOffice || ""}
                onChange={(e) => handleChange("taxOffice", e.target.value)}
                placeholder="Kadıköy Vergi Dairesi"
              />
            </div>

            
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

        <Separator />

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Teslimat Süreleri</h2>
            <p className="text-sm text-gray-600 mt-1">/shipping sayfasında görünen teslimat sürelerini buradan yönetin.</p>
          </div>

          <div className="space-y-4">
            {(settings.deliveryTimes || []).map((item, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-3 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Bölge / Başlık</Label>
                    <Input
                      value={item.title}
                      onChange={(e) => updateDeliveryTime(index, "title", e.target.value)}
                      placeholder="Örn: İstanbul İçi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Süre</Label>
                    <Input
                      value={item.time}
                      onChange={(e) => updateDeliveryTime(index, "time", e.target.value)}
                      placeholder="Örn: 1-2 iş günü"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Textarea
                    value={item.note}
                    onChange={(e) => updateDeliveryTime(index, "note", e.target.value)}
                    placeholder="Açıklama"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeDeliveryTime(index)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Sil
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addDeliveryTime}>
              <Plus className="w-4 h-4 mr-2" />
              Teslimat Satırı Ekle
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">FAQ Yönetimi</h2>
            <p className="text-sm text-gray-600 mt-1">
              Kategori seçip birden fazla soru-cevap ekleyin. Kayıtlar /faq sayfasında otomatik görünür.
            </p>
          </div>

          <div className="space-y-2 max-w-xs">
            <Label>Kategori</Label>
            <Select value={faqCategory} onValueChange={setFaqCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {faqCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {faqDrafts.map((draft, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-3 bg-white">
                <div className="space-y-2">
                  <Label>Soru {index + 1}</Label>
                  <Input
                    value={draft.question}
                    onChange={(e) => updateDraft(index, "question", e.target.value)}
                    placeholder="Soru metni"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cevap {index + 1}</Label>
                  <Textarea
                    value={draft.answer}
                    onChange={(e) => updateDraft(index, "answer", e.target.value)}
                    placeholder="Cevap metni"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeDraft(index)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Sil
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={addDraft}>
                <Plus className="w-4 h-4 mr-2" />
                Soru Ekle
              </Button>
              <Button type="button" onClick={saveFaqs} disabled={faqSaving}>
                {faqSaving ? "Kaydediliyor..." : editingFaqId ? "Kaydı Güncelle" : "Kategoriye Kaydet"}
              </Button>
              <Button type="button" variant="ghost" onClick={loadFaqs}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
              {editingFaqId && (
                <Button type="button" variant="outline" onClick={resetDrafts}>
                  Düzenlemeyi İptal Et
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kayıtlı Sorular</Label>
            <div className="rounded-lg border bg-white max-h-80 overflow-auto">
              {faqLoading ? (
                <div className="p-4 text-sm text-gray-500">Yükleniyor...</div>
              ) : faqList.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Kayıtlı soru yok.</div>
              ) : (
                <div className="divide-y">
                  {faqList.map((faq) => (
                    <div key={faq.id} className="p-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          {faqCategories.find((c) => c.value === faq.category)?.label || faq.category}
                        </div>
                        <div className="font-medium text-sm">{faq.question}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch checked={faq.isActive} onCheckedChange={(val) => toggleFaqActive(faq, val)} />
                        <Button type="button" variant="outline" size="sm" onClick={() => startEditFaq(faq)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => deleteFaq(faq.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
