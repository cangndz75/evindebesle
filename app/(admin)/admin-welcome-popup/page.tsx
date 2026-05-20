"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Gift, Upload, X } from "lucide-react";
import Image from "next/image";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WelcomePopupSettings } from "@/lib/welcome-popup";
import {
  DEFAULT_WELCOME_POPUP_SETTINGS,
  formatWelcomeDiscountLabel,
} from "@/lib/welcome-popup";

export default function AdminWelcomePopupPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState<WelcomePopupSettings>(
    DEFAULT_WELCOME_POPUP_SETTINGS
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadFileToCloudinary(file);
      if (url) {
        update("imageUrl", url);
        toast.success("Görsel yüklendi");
      } else {
        toast.error("Görsel yüklenemedi");
      }
    } catch {
      toast.error("Yükleme sırasında hata oluştu");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/welcome-popup");
        if (res.ok) {
          const data = await res.json();
          setForm({
            isEnabled: data.isEnabled ?? false,
            delayMs: data.delayMs ?? 3000,
            title: data.title ?? "",
            description: data.description ?? "",
            emailPlaceholder: data.emailPlaceholder ?? "",
            consentText: data.consentText ?? "",
            buttonText: data.buttonText ?? "",
            imageUrl: data.imageUrl ?? null,
            showEmailForm: data.showEmailForm ?? true,
            discountType: data.discountType ?? "PERCENT",
            discountValue: data.discountValue ?? 15,
            codePrefix: data.codePrefix ?? "WELCOME",
            couponValidDays: data.couponValidDays ?? 30,
            emailSubject: data.emailSubject ?? "",
            successTitle: data.successTitle ?? "",
            successMessage: data.successMessage ?? "",
          });
        }
      } catch {
        toast.error("Ayarlar yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Başlık zorunludur");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/welcome-popup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Hoş geldin popup ayarları kaydedildi");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Kayıt başarısız");
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof WelcomePopupSettings>(
    key: K,
    value: WelcomePopupSettings[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="admin-page mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Gift className="h-8 w-8" />
          Hoş Geldin Popup
        </h1>
        <p className="text-muted-foreground mt-1">
          Siteye ilk kez gelen ziyaretçilere gösterilecek modalın içeriğini ve
          davranışını buradan yönetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Genel</CardTitle>
          <CardDescription>
            Popup kapalıyken ziyaretçiler hiçbir şey görmez. Açıkken yalnızca
            daha önce kapatmamış olanlara, belirlediğiniz gecikme sonrası
            gösterilir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="isEnabled" className="text-base font-medium">
                Popup aktif
              </Label>
              <p className="text-sm text-muted-foreground">
                Kapalıyken sitede popup görünmez
              </p>
            </div>
            <Switch
              id="isEnabled"
              checked={form.isEnabled}
              onCheckedChange={(v) => update("isEnabled", v)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delayMs">Gecikme (milisaniye)</Label>
            <Input
              id="delayMs"
              type="number"
              min={0}
              max={60000}
              step={500}
              value={form.delayMs}
              onChange={(e) =>
                update("delayMs", Math.max(0, parseInt(e.target.value, 10) || 0))
              }
            />
            <p className="text-xs text-muted-foreground">
              Sayfa yüklendikten kaç ms sonra açılsın (örn. 3000 = 3 saniye)
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="showEmailForm" className="text-base font-medium">
                E-posta formu göster
              </Label>
              <p className="text-sm text-muted-foreground">
                Kapalıysa yalnızca bilgi metni ve kapatma butonu görünür
              </p>
            </div>
            <Switch
              id="showEmailForm"
              checked={form.showEmailForm}
              onCheckedChange={(v) => update("showEmailForm", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İndirim & E-posta Kampanyası</CardTitle>
          <CardDescription>
            Kullanıcı formu gönderdiğinde oluşturulacak tek kullanımlık kupon ve
            Resend ile gidecek e-posta ayarları
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>İndirim türü</Label>
              <Select
                value={form.discountType}
                onValueChange={(v) =>
                  update("discountType", v as "PERCENT" | "AMOUNT")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Yüzde (%)</SelectItem>
                  <SelectItem value="AMOUNT">Sabit tutar (TL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                {form.discountType === "PERCENT" ? "İndirim oranı (%)" : "İndirim (TL)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                min={1}
                max={form.discountType === "PERCENT" ? 100 : 100000}
                value={form.discountValue}
                onChange={(e) =>
                  update(
                    "discountValue",
                    Math.max(1, parseInt(e.target.value, 10) || 1)
                  )
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground rounded-md bg-muted/50 px-3 py-2">
            Önizleme:{" "}
            <strong>
              {formatWelcomeDiscountLabel(form.discountType, form.discountValue)}
            </strong>{" "}
            indirim · kod öneki{" "}
            <strong>{form.codePrefix || "WELCOME"}-XXXXXX</strong>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="codePrefix">Kupon kodu öneki</Label>
              <Input
                id="codePrefix"
                value={form.codePrefix}
                onChange={(e) =>
                  update("codePrefix", e.target.value.toUpperCase())
                }
                placeholder="WELCOME"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="couponValidDays">Geçerlilik (gün)</Label>
              <Input
                id="couponValidDays"
                type="number"
                min={1}
                max={365}
                value={form.couponValidDays}
                onChange={(e) =>
                  update(
                    "couponValidDays",
                    Math.max(1, parseInt(e.target.value, 10) || 30)
                  )
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailSubject">E-posta konusu</Label>
            <Input
              id="emailSubject"
              value={form.emailSubject}
              onChange={(e) => update("emailSubject", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="successTitle">Başarı ekranı başlığı</Label>
            <Input
              id="successTitle"
              value={form.successTitle}
              onChange={(e) => update("successTitle", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="successMessage">Başarı ekranı mesajı</Label>
            <Textarea
              id="successMessage"
              value={form.successMessage}
              onChange={(e) => update("successMessage", e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              {"{email}"} yazarsanız kullanıcının adresi otomatik yerleştirilir.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İçerik</CardTitle>
          <CardDescription>Modalda görünecek metinler ve görsel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="İlk Siparişine Özel..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Görsel (isteğe bağlı)</Label>
            {form.imageUrl && (
              <div className="relative aspect-[2/1] w-full max-w-md overflow-hidden rounded-lg border bg-gray-50">
                <Image
                  src={form.imageUrl}
                  alt="Popup görsel önizleme"
                  fill
                  className="object-cover"
                  sizes="(max-width: 448px) 100vw, 448px"
                />
                <button
                  type="button"
                  onClick={() => update("imageUrl", null)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black"
                  aria-label="Görseli kaldır"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                value={form.imageUrl ?? ""}
                onChange={(e) =>
                  update("imageUrl", e.target.value.trim() || null)
                }
                placeholder="URL veya dosya yükleyin..."
                className="flex-1"
              />
              <input
                type="file"
                id="welcome-popup-image-upload"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploadingImage}
                onClick={() =>
                  document.getElementById("welcome-popup-image-upload")?.click()
                }
              >
                {uploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">
                  {uploadingImage ? "Yükleniyor..." : "Yükle"}
                </span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP veya GIF — en fazla 10 MB
            </p>
          </div>

          {form.showEmailForm && (
            <>
              <div className="space-y-2">
                <Label htmlFor="emailPlaceholder">E-posta alanı placeholder</Label>
                <Input
                  id="emailPlaceholder"
                  value={form.emailPlaceholder}
                  onChange={(e) => update("emailPlaceholder", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consentText">Onay metni (KVKK / koşullar)</Label>
                <Textarea
                  id="consentText"
                  value={form.consentText}
                  onChange={(e) => update("consentText", e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Metinde &quot;Kullanım Koşullarını&quot; ve &quot;Gizlilik Politikasını&quot; ifadeleri otomatik tıklanabilir olur ve modal açar.
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="buttonText">Buton metni</Label>
            <Input
              id="buttonText"
              value={form.buttonText}
              onChange={(e) => update("buttonText", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Önizleme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mx-auto max-w-sm rounded-2xl border bg-white p-6 text-center shadow-sm">
            {form.imageUrl && (
              <div className="mb-4 h-24 w-full overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <h3 className="mb-2 text-lg font-bold">{form.title || "Başlık"}</h3>
            <p className="mb-4 text-sm text-gray-600 whitespace-pre-line">
              {form.description || "Açıklama"}
            </p>
            {form.showEmailForm ? (
              <div className="space-y-2 text-left text-sm text-gray-400">
                <div className="rounded border px-3 py-2">
                  {form.emailPlaceholder}
                </div>
                <p className="text-xs">{form.consentText}</p>
              </div>
            ) : null}
            <div className="mt-4 rounded-lg bg-black py-2 text-sm font-semibold text-white">
              {form.buttonText}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Kaydet
        </Button>
      </div>
    </div>
  );
}
