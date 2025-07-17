"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

export type Coupon = {
  id: string;
  code: string;
  description?: string | null;
  discountType: "PERCENT" | "AMOUNT";
  value: number;
  usageCount: number;
  maxUsage: number | null;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
};

type Props = {
  onSaved?: (newCoupon?: Coupon) => void;
  defaultValues?: Partial<{
    id: string;
    code: string;
    description: string | null;
    discountType: "PERCENT" | "AMOUNT";
    value: number;
    maxUsage: number | null;
    expiresAt: string | Date | null;
    isActive: boolean;
  }>;
  editMode?: boolean;
};

export function CreateCouponForm({ onSaved, defaultValues, editMode }: Props) {
  const [form, setForm] = useState({
    code: defaultValues?.code ?? "",
    description: defaultValues?.description ?? "",
    discountType: defaultValues?.discountType ?? "PERCENT",
    value: defaultValues?.value?.toString() ?? "",
    maxUsage: defaultValues?.maxUsage?.toString() ?? "",
    expiresAt: defaultValues?.expiresAt
      ? new Date(defaultValues.expiresAt)
      : null,
    isActive: defaultValues?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(
      editMode && defaultValues?.id
        ? `/api/admin/coupons/${defaultValues.id}`
        : "/api/admin/coupons",
      {
        method: editMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
          expiresAt: form.expiresAt
            ? new Date(form.expiresAt).toISOString()
            : null,
        }),
      }
    );

    setLoading(false);

    if (res.ok) {
      const newCoupon = await res.json();
      toast.success(editMode ? "Kupon güncellendi!" : "Kupon oluşturuldu!");
      if (!editMode) {
        window.location.reload();
      } else {
        onSaved?.(newCoupon);
      }
    } else {
      toast.error("İşlem başarısız.");
    }
  };

  useEffect(() => {
    if (editMode) {
      window.setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }, 0);
    }
  }, [editMode]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label>Kupon Kodu</Label>
        <div className="flex gap-2">
          <Input
            name="code"
            value={form.code}
            onChange={handleChange}
            required
            autoFocus={false}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const randomCode = Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();
              setForm((prev) => ({ ...prev, code: randomCode }));
            }}
          >
            Oluştur
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Açıklama</Label>
        <Textarea
          name="description"
          value={form.description ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid gap-2">
        <Label>İndirim Türü</Label>
        <Select
          value={form.discountType}
          onValueChange={(val) =>
            setForm((prev) => ({ ...prev, discountType: val as any }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="İndirim türü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PERCENT">% Oran</SelectItem>
            <SelectItem value="AMOUNT">₺ Tutar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>İndirim Değeri</Label>
        <Input
          name="value"
          type="number"
          value={form.value}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label>Kullanım Sınırı</Label>
        <Input
          name="maxUsage"
          type="number"
          value={form.maxUsage}
          onChange={handleChange}
          placeholder="(Sınırsız için boş bırak)"
        />
      </div>

      <div className="grid gap-2">
        <Label>Son Kullanma Tarihi</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.expiresAt ? (
                format(form.expiresAt, "PPP")
              ) : (
                <span>Tarih seç</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={form.expiresAt ?? undefined}
              onSelect={(date) =>
                setForm((prev) => ({ ...prev, expiresAt: date ?? null }))
              }
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-between">
        <Label>Aktif mi?</Label>
        <Switch
          checked={form.isActive}
          onCheckedChange={(val) => setForm((p) => ({ ...p, isActive: val }))}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading
          ? editMode
            ? "Güncelleniyor..."
            : "Oluşturuluyor..."
          : editMode
            ? "Güncelle"
            : "Oluştur"}
      </Button>
    </form>
  );
}
