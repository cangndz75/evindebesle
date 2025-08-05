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
    alarmTimeoutSeconds: defaultData?.alarmTimeoutSeconds || 5,
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
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
        );

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
          { method: "POST", body: formData }
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
      toast.success("Erişim bilgileri başarıyla kaydedildi.");
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto px-4 py-2 rounded-lg bg-white shadow-lg"
    >
      {/* Satır 1 */}
      <div>
        <Label className="text-sm font-medium">Anahtar Nerede?</Label>
        <Input
          value={form.keyLocation}
          onChange={(e) => handleChange("keyLocation", e.target.value)}
        />
      </div>
      <div>
        <Label>Komşu Adı</Label>
        <Input
          value={form.neighborName}
          onChange={(e) => handleChange("neighborName", e.target.value)}
        />
      </div>

      {/* Satır 2 */}
      <div>
        <Label>Anahtar Açıklaması</Label>
        <Textarea
          value={form.keyInstruction}
          onChange={(e) => handleChange("keyInstruction", e.target.value)}
        />
      </div>
      <div>
        <Label>Komşu Daire No</Label>
        <Input
          value={form.neighborFlatNumber}
          onChange={(e) => handleChange("neighborFlatNumber", e.target.value)}
        />
      </div>

      {/* Satır 3 */}
      <div>
        <Label>Kapı Şifresi</Label>
        <Input
          value={form.doorPassword}
          onChange={(e) => handleChange("doorPassword", e.target.value)}
        />
      </div>
      <div>
        <Label>Kapı Notu</Label>
        <Textarea
          value={form.doorNote}
          onChange={(e) => handleChange("doorNote", e.target.value)}
        />
      </div>

      <div>
        <Label>Anahtar Fotoğrafı</Label>
        <ImageUpload
          value={form.keyPhotoUrl || ""}
          onFileSelect={(file) => setImageFile(file)}
        />
      </div>
      <div>
        <Label>Genel Not</Label>
        <Textarea
          value={form.accessNote}
          onChange={(e) => handleChange("accessNote", e.target.value)}
        />
      </div>

      {/* Satır 5 - Switchler */}
      <div className="flex items-center justify-between gap-2">
        <Label>Güvenliği Bilgilendir</Label>
        <Switch
          checked={form.notifySecurityGuard}
          onCheckedChange={(val) => handleChange("notifySecurityGuard", val)}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Label>Giriş Öncesi Arayın</Label>
        <Switch
          checked={form.callBeforeEnter}
          onCheckedChange={(val) => handleChange("callBeforeEnter", val)}
        />
      </div>

      {/* Satır 6 */}
      <div className="md:col-span-2">
        <Label>Hizmet Sonrası Anahtar Bırakma Yeri</Label>
        <Input
          value={form.keyDropLocationAfterService}
          onChange={(e) =>
            handleChange("keyDropLocationAfterService", e.target.value)
          }
        />
      </div>

      {/* Satır 7 - Alarm Switch */}
      <div className="md:col-span-2 flex items-center justify-between mt-2">
        <Label className="font-medium">Alarm Var mı?</Label>
        <Switch
          checked={form.alarmExists}
          onCheckedChange={(val) => handleChange("alarmExists", val)}
        />
      </div>

      {/* Alarm detayları */}
      {form.alarmExists && (
        <>
          <div>
            <Label>Alarm Şifresi</Label>
            <Input
              value={form.alarmPassword || ""}
              onChange={(e) => handleChange("alarmPassword", e.target.value)}
            />
          </div>
          <div>
            <Label>Alarm Odası</Label>
            <Input
              value={form.alarmRoom || ""}
              onChange={(e) => handleChange("alarmRoom", e.target.value)}
            />
          </div>
          <div>
            <Label>Alarm Süresi (sn)</Label>
            <Input
              type="number"
              min={0}
              value={form.alarmTimeoutSeconds || 0}
              onChange={(e) =>
                handleChange("alarmTimeoutSeconds", Number(e.target.value))
              }
            />
          </div>
          <div className="md:col-span-2">
            <Label>Alarm Açıklaması</Label>
            <Textarea
              value={form.alarmInstruction || ""}
              onChange={(e) => handleChange("alarmInstruction", e.target.value)}
            />
          </div>
        </>
      )}

      <div className="md:col-span-2 sticky bottom-0 left-0 bg-white pt-4 pb-2 z-10">
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl text-base"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white mr-2"
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
    </form>
  );
}
