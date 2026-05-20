"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
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
import {
  DEFAULT_CAMPAIGN_BANNER,
  type CampaignDiscountTier,
  type CampaignBannerAdmin,
} from "@/lib/campaign-banner";

type TierFormRow = CampaignDiscountTier & { _key: string };

function newTierKey() {
  return `tier-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function toTierRows(tiers: CampaignDiscountTier[]): TierFormRow[] {
  return tiers.map((t) => ({
    ...t,
    discountType: t.discountType ?? "PERCENT",
    _key: newTierKey(),
  }));
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type CampaignFormState = {
  name: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  badgeText: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  subNote: string;
  themeColor: string;
};

export function campaignToFormState(data: CampaignBannerAdmin): CampaignFormState {
  return {
    name: data.name,
    isActive: data.isActive,
    startsAt: toDatetimeLocal(data.startsAt),
    endsAt: toDatetimeLocal(data.endsAt),
    badgeText: data.badgeText ?? "",
    title: data.title,
    description: data.description ?? "",
    buttonText: data.buttonText ?? "",
    buttonUrl: data.buttonUrl ?? "",
    subNote: data.subNote ?? "",
    themeColor: data.themeColor,
  };
}

export function defaultFormState(): CampaignFormState {
  return {
    name: DEFAULT_CAMPAIGN_BANNER.name,
    isActive: false,
    startsAt: "",
    endsAt: "",
    badgeText: DEFAULT_CAMPAIGN_BANNER.badgeText ?? "",
    title: DEFAULT_CAMPAIGN_BANNER.title,
    description: DEFAULT_CAMPAIGN_BANNER.description ?? "",
    buttonText: DEFAULT_CAMPAIGN_BANNER.buttonText ?? "",
    buttonUrl: DEFAULT_CAMPAIGN_BANNER.buttonUrl ?? "",
    subNote: DEFAULT_CAMPAIGN_BANNER.subNote ?? "",
    themeColor: DEFAULT_CAMPAIGN_BANNER.themeColor,
  };
}

type Props = {
  campaignId: string;
  initial?: CampaignBannerAdmin;
  isNew?: boolean;
};

export default function CampaignBannerForm({
  campaignId,
  initial,
  isNew = false,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CampaignFormState>(() =>
    initial ? campaignToFormState(initial) : defaultFormState()
  );
  const [tiers, setTiers] = useState<TierFormRow[]>(() =>
    toTierRows(
      initial?.discountTiers?.length
        ? initial.discountTiers
        : DEFAULT_CAMPAIGN_BANNER.discountTiers
    )
  );

  const updateField = <K extends keyof CampaignFormState>(
    key: K,
    value: CampaignFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateTier = (
    key: string,
    field: keyof CampaignDiscountTier,
    value: string | number
  ) => {
    setTiers((prev) =>
      prev.map((t) => (t._key === key ? { ...t, [field]: value } : t))
    );
  };

  const addTier = () => {
    setTiers((prev) => [
      ...prev,
      {
        _key: newTierKey(),
        threshold: 2000,
        discount: 10,
        discountType: "PERCENT",
      },
    ]);
  };

  const removeTier = (key: string) => {
    setTiers((prev) => prev.filter((t) => t._key !== key));
  };

  const buildPayload = () => {
    const normalizedTiers = tiers
      .map(({ threshold, discount, discountType }) => ({
        threshold: Number(threshold),
        discount: Number(discount),
        discountType: discountType ?? "PERCENT",
      }))
      .filter((t) => t.threshold > 0 && t.discount > 0);

    return {
      ...form,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      discountTiers: normalizedTiers,
    };
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Kampanya adı zorunludur");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Ana başlık zorunludur");
      return;
    }

    const payload = buildPayload();
    if (form.isActive && payload.discountTiers.length === 0) {
      toast.error("Yayında kampanyada en az bir kademe gerekli");
      return;
    }

    setSaving(true);
    try {
      const url = isNew
        ? "/api/admin/campaign-banner"
        : `/api/admin/campaign-banner/${campaignId}`;
      const method = isNew ? "POST" : "PATCH";

      let res: Response;
      if (isNew) {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name.trim() }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Oluşturulamadı");
          return;
        }
        const created = await res.json();
        res = await fetch(`/api/admin/campaign-banner/${created.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success("Kampanya oluşturuldu");
          router.replace(`/admin-campaign-banner/${created.id}`);
          return;
        }
      } else {
        res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success("Kampanya kaydedildi");
        router.refresh();
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Genel</CardTitle>
          <CardDescription>
            Admin panelinde görünen iç ad. Aynı anda yalnızca bir kampanya
            yayında olabilir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Kampanya Adı (iç kullanım)</Label>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Örn: Bayram 2026"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Yayında</Label>
              <p className="text-xs text-muted-foreground">
                Açınca diğer kampanyalar otomatik kapanır.
              </p>
            </div>
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={(v) => updateField("isActive", v)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Başlangıç (opsiyonel)</Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => updateField("startsAt", e.target.value)}
              />
            </div>
            <div>
              <Label>Bitiş (opsiyonel)</Label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => updateField("endsAt", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banner Metinleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Rozet Metni</Label>
            <Input
              value={form.badgeText}
              onChange={(e) => updateField("badgeText", e.target.value)}
            />
          </div>
          <div>
            <Label>Ana Başlık</Label>
            <Textarea
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">
              İkinci satır italik. Yeni satır için Enter.
            </p>
          </div>
          <div>
            <Label>Açıklama</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Buton Metni</Label>
              <Input
                value={form.buttonText}
                onChange={(e) => updateField("buttonText", e.target.value)}
              />
            </div>
            <div>
              <Label>Buton Linki</Label>
              <Input
                value={form.buttonUrl}
                onChange={(e) => updateField("buttonUrl", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Alt Not</Label>
            <Input
              value={form.subNote}
              onChange={(e) => updateField("subNote", e.target.value)}
            />
          </div>
          <div>
            <Label>Tema</Label>
            <Select
              value={form.themeColor}
              onValueChange={(v) => updateField("themeColor", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="olive">Olive</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="velvet">Velvet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>İndirim Kademeleri</CardTitle>
            <CardDescription>Sepet ve ödemede otomatik uygulanır.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addTier}>
            <Plus className="w-4 h-4 mr-1" />
            Yeni Kademe
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {tiers.map((tier) => (
            <div
              key={tier._key}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 border rounded-lg bg-muted/30"
            >
              <div className="md:col-span-3">
                <Label>Min. Sepet (TL)</Label>
                <Input
                  type="number"
                  min={1}
                  value={tier.threshold}
                  onChange={(e) =>
                    updateTier(tier._key, "threshold", Number(e.target.value))
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Label>Tip</Label>
                <Select
                  value={tier.discountType ?? "PERCENT"}
                  onValueChange={(v) =>
                    updateTier(tier._key, "discountType", v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Yüzde (%)</SelectItem>
                    <SelectItem value="AMOUNT">Sabit TL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-4">
                <Label>Değer</Label>
                <Input
                  type="number"
                  min={1}
                  value={tier.discount}
                  onChange={(e) =>
                    updateTier(tier._key, "discount", Number(e.target.value))
                  }
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removeTier(tier._key)}
                  disabled={tiers.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Kaydet
        </Button>
      </div>
    </div>
  );
}
