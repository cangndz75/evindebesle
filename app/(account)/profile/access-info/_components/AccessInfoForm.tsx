"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ImageUpload from "./ImageUpload";

export type AccessInfo = {
  appointmentId?: string;
  keyLocation: string;
  keyInstruction?: string;
  keyPhotoUrl?: string;
  accessNote?: string;
  doorPassword?: string;
  doorNote?: string;
  alarmExists?: boolean;
  alarmInstruction?: string;
  alarmRoom?: string;
  alarmPassword?: string;
  alarmTimeoutSeconds?: number;
  notifySecurityGuard?: boolean;
  callBeforeEnter?: boolean;
  keyDropLocationAfterService?: string;
  neighborName?: string;
  neighborFlatNumber?: string;
};

type Props = {
  defaultData?: AccessInfo;
  onSaved: () => void;
};

export default function AccessInfoForm({ defaultData, onSaved }: Props) {
  const [form, setForm] = useState<AccessInfo>({
    keyLocation: defaultData?.keyLocation || "",
    keyInstruction: defaultData?.keyInstruction || "",
    keyPhotoUrl: defaultData?.keyPhotoUrl || "",
    accessNote: defaultData?.accessNote || "",
    doorPassword: defaultData?.doorPassword || "",
    doorNote: defaultData?.doorNote || "",
    alarmExists: defaultData?.alarmExists || false,
    alarmInstruction: defaultData?.alarmInstruction || "",
    alarmRoom: defaultData?.alarmRoom || "",
    alarmPassword: defaultData?.alarmPassword || "",
    alarmTimeoutSeconds:
      typeof defaultData?.alarmTimeoutSeconds === "number"
        ? defaultData.alarmTimeoutSeconds
        : 5,
    notifySecurityGuard: defaultData?.notifySecurityGuard || false,
    callBeforeEnter: defaultData?.callBeforeEnter || false,
    keyDropLocationAfterService: defaultData?.keyDropLocationAfterService || "",
    neighborName: defaultData?.neighborName || "",
    neighborFlatNumber: defaultData?.neighborFlatNumber || "",
  });

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (key: keyof AccessInfo, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let imageUrl = form.keyPhotoUrl;

      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        fd.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
        );

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
          { method: "POST", body: fd }
        );
        if (!res.ok) throw new Error("Görsel yüklenemedi");
        const data = await res.json();
        imageUrl = data.secure_url;
      }

      const res = await fetch("/api/access-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, keyPhotoUrl: imageUrl }),
      });
      if (!res.ok) throw new Error("Kayıt başarısız");

      toast.success("Erişim bilgileri kaydedildi.");
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const iOSField = "text-[16px] h-11"; // iOS zoom fix

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.keyLocation.trim()) {
          toast.error("Lütfen 'Anahtar Nerede?' alanını doldurun.");
          return;
        }
        handleSubmit();
      }}
      className="relative max-h-[78vh] overflow-y-auto px-2 sm:px-4"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* --- Bölüm: Anahtar & Komşu --- */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Anahtar & Komşu</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">
              Anahtar Nerede? <span className="text-red-500">*</span>
            </Label>
            <Input
              aria-label="Anahtar Nerede"
              placeholder="Örn: Apartman görevlisinde / Posta kutusunda"
              value={form.keyLocation}
              onChange={(e) => handleChange("keyLocation", e.target.value)}
              className={iOSField}
            />
          </div>

          <div>
            <Label className="text-sm">Komşu Adı</Label>
            <Input
              aria-label="Komşu Adı"
              placeholder="Örn: Ayşe Hanım"
              value={form.neighborName}
              onChange={(e) => handleChange("neighborName", e.target.value)}
              className={iOSField}
            />
          </div>

          <div>
            <Label className="text-sm">Anahtar Açıklaması</Label>
            <Textarea
              aria-label="Anahtar Açıklaması"
              placeholder="Anahtarın konumu veya alınış şekliyle ilgili notlar"
              value={form.keyInstruction}
              onChange={(e) => handleChange("keyInstruction", e.target.value)}
              className="min-h-[88px] text-[16px]"
            />
          </div>

          <div>
            <Label className="text-sm">Komşu Daire No</Label>
            <Input
              aria-label="Komşu Daire No"
              placeholder="Örn: 4B"
              value={form.neighborFlatNumber}
              onChange={(e) =>
                handleChange("neighborFlatNumber", e.target.value)
              }
              className={iOSField}
            />
          </div>
        </div>
      </section>

      {/* --- Bölüm: Kapı Bilgisi --- */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm space-y-4 mb-4">
        <h3 className="text-base font-semibold">Kapı Bilgisi</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Kapı Şifresi</Label>
            <Input
              aria-label="Kapı Şifresi"
              placeholder="Şifre (varsa)"
              value={form.doorPassword}
              onChange={(e) => handleChange("doorPassword", e.target.value)}
              className={iOSField}
            />
          </div>

          <div>
            <Label className="text-sm">Kapı Notu</Label>
            <Textarea
              aria-label="Kapı Notu"
              placeholder="Örn: Kapı kolu sıkıdır, yukarı kaldırarak açın"
              value={form.doorNote}
              onChange={(e) => handleChange("doorNote", e.target.value)}
              className="min-h-[88px] text-[16px]"
            />
          </div>
        </div>
      </section>

      {/* --- Bölüm: Medya & Not --- */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm space-y-4 mb-4">
        <h3 className="text-base font-semibold">Medya & Not</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Anahtar Fotoğrafı</Label>
            <div className="rounded-xl border p-3">
              <ImageUpload
                value={form.keyPhotoUrl || ""}
                onFileSelect={(file) => setImageFile(file)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                (İsteğe bağlı) Anahtarın veya konumunun fotoğrafı.
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm">Genel Not</Label>
            <Textarea
              aria-label="Genel Not"
              placeholder="Eklemek istediğiniz genel notlar"
              value={form.accessNote}
              onChange={(e) => handleChange("accessNote", e.target.value)}
              className="min-h-[120px] text-[16px]"
            />
          </div>
        </div>
      </section>

      {/* --- Bölüm: Tercihler --- */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm space-y-3 mb-4">
        <h3 className="text-base font-semibold">Tercihler</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <Label className="text-sm">Güvenliği Bilgilendir</Label>
              <p className="text-xs text-muted-foreground">
                Site güvenliğine haber verilsin.
              </p>
            </div>
            <Switch
              checked={form.notifySecurityGuard}
              onCheckedChange={(v) => handleChange("notifySecurityGuard", v)}
              aria-label="Güvenliği Bilgilendir"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <Label className="text-sm">Giriş Öncesi Arayın</Label>
              <p className="text-xs text-muted-foreground">
                Girişten önce telefonla bilgi verilsin.
              </p>
            </div>
            <Switch
              checked={form.callBeforeEnter}
              onCheckedChange={(v) => handleChange("callBeforeEnter", v)}
              aria-label="Giriş Öncesi Arayın"
            />
          </div>
        </div>

        <div className="mt-2">
          <Label className="text-sm">Hizmet Sonrası Anahtar Bırakma Yeri</Label>
          <Input
            aria-label="Hizmet Sonrası Anahtar Bırakma Yeri"
            placeholder="Örn: Aynı yer / Kapı altı / Güvenlik"
            value={form.keyDropLocationAfterService}
            onChange={(e) =>
              handleChange("keyDropLocationAfterService", e.target.value)
            }
            className={iOSField}
          />
        </div>
      </section>

      {/* --- Bölüm: Alarm --- */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm space-y-4 mb-24">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Alarm Bilgisi</h3>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Alarm Var mı?</Label>
            <Switch
              checked={form.alarmExists}
              onCheckedChange={(v) => handleChange("alarmExists", v)}
              aria-label="Alarm Var mı?"
            />
          </div>
        </div>

        {form.alarmExists && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Alarm Şifresi</Label>
              <Input
                aria-label="Alarm Şifresi"
                placeholder="****"
                value={form.alarmPassword || ""}
                onChange={(e) => handleChange("alarmPassword", e.target.value)}
                className={iOSField}
              />
            </div>

            <div>
              <Label className="text-sm">Alarm Odası</Label>
              <Input
                aria-label="Alarm Odası"
                placeholder="Örn: Salon"
                value={form.alarmRoom || ""}
                onChange={(e) => handleChange("alarmRoom", e.target.value)}
                className={iOSField}
              />
            </div>

            <div>
              <Label className="text-sm">Alarm Süresi (sn)</Label>
              <Input
                aria-label="Alarm Süresi (saniye)"
                type="number"
                inputMode="numeric"
                min={0}
                value={
                  typeof form.alarmTimeoutSeconds === "number"
                    ? form.alarmTimeoutSeconds
                    : 0
                }
                onChange={(e) =>
                  handleChange(
                    "alarmTimeoutSeconds",
                    e.target.value === ""
                      ? 0
                      : Math.max(0, Number(e.target.value))
                  )
                }
                className={iOSField}
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm">Alarm Açıklaması</Label>
              <Textarea
                aria-label="Alarm Açıklaması"
                placeholder="Alarm kurulumu/iptali hakkında kısa açıklama"
                value={form.alarmInstruction || ""}
                onChange={(e) =>
                  handleChange("alarmInstruction", e.target.value)
                }
                className="min-h-[100px] text-[16px]"
              />
            </div>
          </div>
        )}
      </section>

      {/* Sticky Save */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-4">
        <div className="mx-auto max-w-[680px] sm:max-w-[720px] md:max-w-[900px]">
          <div className="pointer-events-auto rounded-2xl border bg-white/95 backdrop-blur p-2 shadow-lg">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-base"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              ) : (
                "Kaydet"
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
