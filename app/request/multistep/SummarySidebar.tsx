"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    selectedServices: string[];
    selectedServicesBySpecies?: Record<string, string[]>;
    services: Service[];
    petTypes: PetType[];
    dateRange?: { from?: Date | string; to?: Date | string };
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
    selectedSpecies,
    selectedUserPetsBySpecies,
    selectedServices,
    selectedServicesBySpecies,
    services,
    petTypes,
    dateRange,
    timeSlot,
    repeatType = "none",
    repeatCount,
    address,
    appliedCoupon,
  } = formData || {};

  // Tür bazlı veya tek liste olarak seçilen servis ID'leri
  const selectedServiceIds = useMemo(() => {
    if (Array.isArray(selectedServices)) return selectedServices;
    if (
      selectedServicesBySpecies &&
      typeof selectedServicesBySpecies === "object"
    ) {
      return Object.values(selectedServicesBySpecies).flat();
    }
    return [];
  }, [selectedServices, selectedServicesBySpecies]);

  const speciesName = (id: string) =>
    petTypes?.find((p) => p.id === id)?.name || id;

  const countsBySpecies = useMemo(() => {
    const counts: Record<string, number> = {};
    (selectedSpecies || []).forEach((sid) => {
      counts[sid] = selectedUserPetsBySpecies?.[sid]?.length || 0;
    });
    return counts;
  }, [selectedSpecies, selectedUserPetsBySpecies]);

  const speciesIdByName = useMemo(() => {
    const map: Record<string, string> = {};
    (petTypes || []).forEach((pt) => {
      if (pt.name) {
        map[pt.name.toUpperCase()] = pt.id;
      }
    });
    return map;
  }, [petTypes]);

  const lineItems = useMemo(() => {
    if (!services || !selectedServiceIds.length) return [];

    return selectedServiceIds
      .map((sid: string) => services.find((s: Service) => s.id === sid))
      .filter((svc: Service | undefined): svc is Service => Boolean(svc))
      .map((svc: Service) => {
        const affectedSpeciesIds = (svc.petTags || [])
          .map((name: string) => speciesIdByName[(name || "").toUpperCase()])
          .filter((spId: string | undefined): spId is string => Boolean(spId));

        const totalCount = affectedSpeciesIds.reduce(
          (sum: number, spId: string) => sum + (countsBySpecies[spId] || 0),
          0
        );

        return {
          id: svc.id,
          name: svc.name,
          unitPrice: svc.price || 0,
          count: totalCount,
          subtotal: (svc.price || 0) * totalCount,
          speciesNames: affectedSpeciesIds.map((spId: string) =>
            speciesName(spId)
          ),
        };
      })
      .filter((item: { count: number }) => item.count > 0);
  }, [
    services,
    selectedServiceIds,
    speciesIdByName,
    countsBySpecies,
    speciesName,
  ]);

  const totalPrice = useMemo(
    () =>
      lineItems.reduce(
        (sum: number, li: { subtotal: number }) => sum + li.subtotal,
        0
      ),
    [lineItems]
  );

  const discountedPrice = useMemo(() => {
    if (!appliedCoupon) return totalPrice;
    if (appliedCoupon.discountType === "PERCENT") {
      const d = (totalPrice * appliedCoupon.value) / 100;
      return Math.max(totalPrice - d, 0);
    }
    return Math.max(totalPrice - appliedCoupon.value, 0);
  }, [appliedCoupon, totalPrice]);

  const defaultStart = async () => {
    try {
      if (!selectedServiceIds.length) {
        toast.error("Lütfen en az bir hizmet seçin.");
        return;
      }
      const totalPets = Object.values(selectedUserPetsBySpecies || {}).reduce(
        (s: number, arr: string[]) => s + (arr?.length || 0),
        0
      );
      if (totalPets < 1) {
        toast.error("Lütfen evcil hayvan seçin.");
        return;
      }
      if (!address?.id) {
        toast.error("Lütfen adres seçin.");
        return;
      }

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
    if (onStart) {
      onStart({ totalPrice, discountedPrice });
    } else {
      defaultStart();
    }
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
            {(selectedSpecies || []).map((id) => (
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

        <div className="border-t pt-2">
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

        <Button className="w-full mt-2" onClick={handleStart}>
          Hizmeti Başlat
        </Button>
      </CardContent>
    </Card>
  );
}
