"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PetType = { id: string; name: string };
type Service = {
  id: string;
  name: string;
  price: number;
  description?: string;
  petTags: string[];
};
type Address = { id: string; fullAddress: string; districtId: string };

type Coupon = {
  id?: string;
  code: string;
  discountType: "PERCENT" | "FIXED" | "AMOUNT";
  value: number;
};

interface SummarySidebarProps {
  formData: {
    selectedSpecies: string[];
    selectedUserPetsBySpecies: Record<string, string[]>;
    selectedServicesBySpecies?: Record<string, string[]>;
    services: Service[];
    petTypes: PetType[];
    dateRange?: { from?: Date | string; to?: Date | string } | null;
    dates?: Array<Date | string>;
    timeSlot?: string;
    repeatType?: "none" | "daily" | "weekly" | "monthly";
    repeatCount?: number | null;
    address?: Address | null;
    appliedCoupon?: Coupon | null;
  };
  onStart?: (payload: { totalPrice: number; discountedPrice: number }) => void;
}

const SLOT_LABELS: Record<string, string> = {
  morning: "Sabah (08:00 - 12:00)",
  noon: "Öğle (12:00 - 16:00)",
  evening: "Akşam (16:00 - 20:00)",
};

export default function SummarySidebar({
  formData,
  onStart,
}: SummarySidebarProps) {
  const router = useRouter();

  const {
    selectedSpecies = [],
    selectedUserPetsBySpecies = {},
    selectedServicesBySpecies = {},
    services = [],
    petTypes = [],
    dateRange,
    dates,
    timeSlot,
    repeatType = "none",
    repeatCount,
    address,
    appliedCoupon,
  } = formData || {};

  // Agreements modal + checkbox state
  const [agreementsOpen, setAgreementsOpen] = useState(false);
  const [agreementsAccepted, setAgreementsAccepted] = useState(false);

  const speciesName = (id: string) =>
    petTypes?.find((p) => p.id === id)?.name || id;

  // Tür → seçili owned-pet adedi
  const countsBySpecies = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedSpecies.forEach((sid) => {
      counts[sid] = selectedUserPetsBySpecies?.[sid]?.length || 0;
    });
    return counts;
  }, [selectedSpecies, selectedUserPetsBySpecies]);

  // Servis lookup
  const serviceById = useMemo(() => {
    const map: Record<string, Service> = {};
    for (const s of services) map[s.id] = s;
    return map;
  }, [services]);

  type Line = {
    id: string;
    name: string;
    unitPrice: number;
    count: number;
    speciesNames: string[];
    subtotal: number;
  };

  const lineItems: Line[] = useMemo(() => {
    const agg: Record<string, Omit<Line, "subtotal">> = {};

    Object.entries(selectedServicesBySpecies).forEach(([speciesId, svcIds]) => {
      const petCount = countsBySpecies[speciesId] || 0;
      if (petCount < 1) return;
      for (const sid of svcIds || []) {
        const svc = serviceById[sid];
        if (!svc) continue;
        if (!agg[sid]) {
          agg[sid] = {
            id: sid,
            name: svc.name,
            unitPrice: svc.price || 0,
            count: 0,
            speciesNames: [],
          };
        }
        agg[sid].count += petCount;
        const nm = speciesName(speciesId);
        if (!agg[sid].speciesNames.includes(nm)) agg[sid].speciesNames.push(nm);
      }
    });

    return Object.values(agg)
      .map((x) => ({ ...x, subtotal: x.unitPrice * x.count }))
      .filter((x) => x.count > 0);
  }, [selectedServicesBySpecies, countsBySpecies, serviceById, speciesName]);

  // Benzersiz gün sayısı
  const serviceDayCount = useMemo(() => {
    const list: Date[] = Array.isArray(dates)
      ? dates.map((d) => new Date(d as any))
      : [];

    if (!list.length && (dateRange?.from || dateRange?.to)) {
      const from = dateRange?.from ? new Date(dateRange.from) : null;
      const to = dateRange?.to ? new Date(dateRange.to) : null;
      if (from && to) {
        const cur = new Date(
          from.getFullYear(),
          from.getMonth(),
          from.getDate()
        );
        const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
        while (cur <= end) {
          list.push(new Date(cur));
          cur.setDate(cur.getDate() + 1);
        }
      } else if (from) {
        list.push(new Date(from));
      }
    }

    if (!list.length) return 1;
    const keys = new Set(
      list.map((d) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      )
    );
    return Math.max(keys.size, 1);
  }, [dates, dateRange]);

  const baseTotal = useMemo(
    () => lineItems.reduce((sum, li) => sum + li.subtotal, 0),
    [lineItems]
  );

  const totalPrice = useMemo(
    () => baseTotal * serviceDayCount,
    [baseTotal, serviceDayCount]
  );

  const discountedPrice = useMemo(() => {
    if (!appliedCoupon) return totalPrice;
    if (appliedCoupon.discountType === "PERCENT") {
      const d = (totalPrice * appliedCoupon.value) / 100;
      return Math.max(totalPrice - d, 0);
    }
    return Math.max(totalPrice - appliedCoupon.value, 0);
  }, [appliedCoupon, totalPrice]);

  // Submit validation (button disabled logic)
  const totalPets = useMemo(
    () =>
      Object.values(selectedUserPetsBySpecies || {}).reduce(
        (s, arr) => s + (arr?.length || 0),
        0
      ),
    [selectedUserPetsBySpecies]
  );
  const hasServices = lineItems.length > 0;
  const hasPets = totalPets > 0;
  const hasAddress = Boolean(address?.id);
  const hasTimeSlot = Boolean(timeSlot);
  const hasDates = Boolean(
    (dates && dates.length > 0) || (dateRange?.from && dateRange?.to)
  );
  const canStart =
    hasServices &&
    hasPets &&
    hasAddress &&
    hasTimeSlot &&
    hasDates &&
    agreementsAccepted;

  const defaultStart = async () => {
    try {
      if (!canStart) return;
      const res = await fetch("/api/draft-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalPrice: discountedPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Taslak oluşturulamadı.");

      toast.success("Taslak randevu oluşturuldu.");
      const id = data?.id || data?.draftAppointmentId;
      router.push(
        `/request/step3?totalPrice=${discountedPrice}&draftAppointmentId=${id}`
      );
    } catch (err: any) {
      toast.error(err?.message || "Hizmeti başlatılamadı.");
    }
  };

  const handleStart = () => {
    if (!canStart) return;
    if (onStart) onStart({ totalPrice, discountedPrice });
    else defaultStart();
  };

  const from = dateRange?.from ? new Date(dateRange.from) : null;
  const to = dateRange?.to ? new Date(dateRange.to) : null;

  return (
    <Card className="border shadow-md sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg">Sipariş Özeti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        {/* Seçilen türler */}
        <div>
          <p className="text-xs italic text-primary mb-1">
            Seçilen Hayvan Türleri
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {selectedSpecies.map((id) => (
              <Badge key={id} variant="secondary">
                {speciesName(id)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Seçilen hizmetler */}
        <div>
          <p className="text-xs italic text-primary mb-1">Seçilen Hizmetler</p>
          {lineItems.length === 0 ? (
            <p className="italic">Henüz hizmet seçilmedi.</p>
          ) : (
            <ul className="space-y-1">
              {lineItems.map((li) => (
                <li key={li.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate">
                      {li.name} <span className="opacity-70">× {li.count}</span>
                      {li.speciesNames.length > 0 && (
                        <span className="opacity-60">
                          {" "}
                          • {li.speciesNames.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="whitespace-nowrap">
                    {li.subtotal.toLocaleString()}₺
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Zaman bilgisi */}
        {(from || to || timeSlot) && (
          <div>
            <p className="text-xs text-muted">Zaman</p>
            {from && to && (
              <p>
                {format(from, "d MMMM yyyy", { locale: tr })} –{" "}
                {format(to, "d MMMM yyyy", { locale: tr })}
              </p>
            )}
            {timeSlot && (
              <p className="mt-1">{SLOT_LABELS[timeSlot] || timeSlot}</p>
            )}
            {repeatType !== "none" && (
              <p className="mt-1">
                Tekrar: {repeatType} {repeatCount ? `• ${repeatCount} kez` : ""}
              </p>
            )}
          </div>
        )}

        {/* Adres */}
        {address?.fullAddress && (
          <div>
            <p className="text-xs text-muted">Adres</p>
            <p>{address.fullAddress}</p>
          </div>
        )}

        {/* Kupon */}
        {appliedCoupon && (
          <div className="flex items-center justify-between">
            <span>
              Kupon: <strong>{appliedCoupon.code}</strong>
            </span>
            <span className="text-green-700 font-medium">
              {appliedCoupon.discountType === "PERCENT"
                ? `-%${appliedCoupon.value}`
                : `-${appliedCoupon.value}₺`}
            </span>
          </div>
        )}

        {/* Toplamlar */}
        <div className="border-t pt-2">
          <div className="flex items-center justify-between text-xs opacity-70">
            <span>Gün sayısı</span>
            <span>× {serviceDayCount}</span>
          </div>
          <div className="flex items-center justify-between text-base">
            <span>Toplam:</span>
            <span className="font-semibold">
              {discountedPrice.toLocaleString()}₺
            </span>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>Kuponsuz</span>
              <span className="line-through">
                {totalPrice.toLocaleString()}₺
              </span>
            </div>
          )}
        </div>

        <Button
          className="w-full mt-2"
          onClick={handleStart}
          disabled={!canStart}
        >
          Hizmeti Başlat
        </Button>
        
      </CardContent>
    </Card>
  );
}
