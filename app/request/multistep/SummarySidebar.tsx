"use client";

import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AgreementsCheckbox from "../_components/AgreementsCheckbox";
import { useSession } from "next-auth/react";

type MeResponse = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  isTestUser?: boolean;
  primaryAddress?: {
    id: string;
    districtId: string;
    fullAddress: string;
  } | null;
} | null;

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
type AgreementsStateType = {
  preInfoAccepted: boolean;
  distanceAccepted: boolean;
};

type PaymentCard = {
  number: string; // 16 hane (sadece rakam)
  name: string;
  expireMonth: string; // "01".."12"
  expireYear: string; // "2025" gibi
  cvc: string; // "123"
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
    paymentMethod?: string | null;
    recipientName?: string | null;
    invoiceAddressText?: string | null;
    paymentCard?: PaymentCard | null; // Step1'den gelir
  };
}

function toMidnightISO(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function collectDates(formData: any): string[] {
  const { dates, dateRange } = formData || {};
  if (Array.isArray(dates) && dates.length)
    return dates.map((d: any) => toMidnightISO(new Date(d)));
  const from = dateRange?.from ? new Date(dateRange.from) : null;
  const to = dateRange?.to ? new Date(dateRange.to) : null;
  const out: string[] = [];
  if (from && to) {
    const cur = new Date(from);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);
    while (cur <= end) {
      out.push(cur.toISOString());
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }
  if (from) return [toMidnightISO(from)];
  return [];
}

function buildDraftPayload(formData: any, totalPrice: number, isTest = false) {
  const {
    selectedUserPetsBySpecies = {},
    selectedServicesBySpecies = {},
    address,
    repeatType = "none",
    repeatCount,
    selectedSpecies,
    services,
    petTypes,
    dateRange,
    timeSlot,
    appliedCoupon,
    paymentMethod,
    recipientName,
    invoiceAddressText,
  } = formData ?? {};

  const ownedPetIds: string[] = Object.values<string[]>(
    selectedUserPetsBySpecies
  ).flat();
  const serviceIds: string[] = Array.from(
    new Set(Object.values<string[]>(selectedServicesBySpecies).flat())
  );
  const userAddressId = address?.id as string | undefined;
  const isRecurring = repeatType !== "none";

  return {
    ownedPetIds,
    serviceIds,
    userAddressId,
    isRecurring,
    recurringType: isRecurring ? repeatType : undefined,
    recurringCount: isRecurring ? (repeatCount ?? undefined) : undefined,

    // server kendi hesaplıyor ama göndersek de sorun değil
    totalPrice,
    isTest,

    selectedSpecies,
    services,
    petTypes,
    dateRange,
    dates: collectDates(formData),
    timeSlot,
    repeatType,
    repeatCount,
    appliedCoupon,
    paymentMethod,
    recipientName,
    invoiceAddressText,
  };
}

export default function SummarySidebar({ formData }: SummarySidebarProps) {
  const router = useRouter();
  const { status, data: session } = useSession();

  const [canTest, setCanTest] = useState(false);
  useEffect(() => {
    if (status === "authenticated")
      setCanTest(Boolean(session?.user?.isTestUser));
    if (status === "unauthenticated") setCanTest(false);
  }, [status, session]);

  const [me, setMe] = useState<MeResponse>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/user/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as MeResponse;
        if (alive) setMe(data);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (me && typeof me.isTestUser !== "undefined") {
      setCanTest(Boolean(me.isTestUser));
    }
  }, [me]);

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
    paymentMethod,
    recipientName,
    invoiceAddressText,
    paymentCard, // Step1'den gelen kart
  } = formData || {};

  const [agreements, setAgreements] = useState<AgreementsStateType>({
    preInfoAccepted: false,
    distanceAccepted: false,
  });

  const SLOT_LABELS: Record<string, string> = {
    morning: "Sabah (08:00 - 12:00)",
    noon: "Öğle (12:00 - 16:00)",
    evening: "Akşam (16:00 - 20:00)",
  };
  const SELLER_INFO = {
    title: "Dogo Petshop LTD. ŞTİ.",
    address:
      "Uptwins Blok, Orta, Yalnız Selvi Cd. No: 5AB, 34880 Kartal/İstanbul",
    tax: "Yakacık Vergi Dairesi | VKN: 3021119045 • MERSİS: 0302111904500001 • Tel: +90 216 519 26 00 • E-posta: info@evindebesle.com",
  };
  const PLATFORM_INFO = {
    title: "evindebesle.com",
    address: "evindebesle.com",
  };

  const speciesName = (id: string) =>
    petTypes?.find((p) => p.id === id)?.name || id;

  const countsBySpecies = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedSpecies.forEach((sid) => {
      counts[sid] = selectedUserPetsBySpecies?.[sid]?.length || 0;
    });
    return counts;
  }, [selectedSpecies, selectedUserPetsBySpecies]);

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
  }, [selectedServicesBySpecies, countsBySpecies, serviceById, petTypes]);

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
      } else if (from) list.push(new Date(from));
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
  const canStartCore =
    hasServices && hasPets && hasAddress && hasTimeSlot && hasDates;
  const canStartPaid =
    canStartCore && agreements.preInfoAccepted && agreements.distanceAccepted;
  const canStartTest =
    canStartCore && agreements.preInfoAccepted && agreements.distanceAccepted;

  // Taslak oluştur (server schema ile uyumlu)
  const createDraft = async (price: number, isTest: boolean) => {
    const payload = buildDraftPayload(formData, price, isTest);
    const res = await fetch("/api/draft-appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data?.message || data?.error || "Taslak oluşturulamadı.");
    return {
      id: data?.draftAppointmentId || data?.id,
      finalPrice: data?.finalPrice ?? price,
    };
  };

  // Ortak kontroller
  const validateCore = () => {
    if (!hasAddress) return "Lütfen adres seçin.";
    if (!hasDates) return "Lütfen tarih aralığı seçin.";
    if (!hasPets) return "Lütfen evcil hayvan seçin.";
    if (!hasServices) return "Lütfen en az bir hizmet seçin.";
    if (!hasTimeSlot) return "Lütfen saat aralığı seçin.";
    return null;
  };
  const validateCardFromFormData = (card?: PaymentCard | null) => {
    if (!card) return "Kart bilgilerini Step1’de doldurun.";
    const num = String(card.number || "").replace(/\D/g, "");
    const cvc = String(card.cvc || "").replace(/\D/g, "");
    const mm = Number(card.expireMonth);
    const yy = Number(card.expireYear);
    const cy = new Date().getFullYear();
    if (num.length !== 16) return "Kart numarası 16 hane olmalı (Step1).";
    if (cvc.length !== 3) return "CVV 3 hane olmalı (Step1).";
    if (!card.name?.trim()) return "Kart üzerindeki isim gerekli (Step1).";
    if (mm < 1 || mm > 12) return "Ay değeri 01–12 aralığında olmalı (Step1).";
    if (yy < cy) return "Son kullanma yılı geçersiz (Step1).";
    return null;
  };

  const handleMockPayment = async () => {
    try {
      const e1 = validateCore();
      if (e1) return toast.error(e1);

      const draft = await createDraft(discountedPrice, true);
      console.log(">>> calling /api/payment/complete", {
        draftAppointmentId: draft.id,
        paidPrice: discountedPrice,
        conversationId: "TEST-MODE",
        paymentId: `MOCK-${Date.now()}`,
      });

      const resp = await fetch("/api/payment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftAppointmentId: draft.id,
          paidPrice: discountedPrice,
          conversationId: "TEST-MODE",
          paymentId: `MOCK-${Date.now()}`,
        }),
      });

      console.log(">>> response status", resp.status);
      const data = await resp.json().catch(() => null);
      console.log(">>> response data", data);
      if (!resp.ok)
        throw new Error(data?.error || "Ödeme / randevu tamamlanamadı");
      toast.success("Test ödemesi başarılı, randevu oluşturuldu.");
      router.push(
        data?.appointmentId
          ? `/success?appointmentId=${data.appointmentId}`
          : `/success`
      );
    } catch (e: any) {
      toast.error(e?.message || "Ödeme hatası");
    }
  };

  const handleStartLivePayment = async () => {
    try {
      const e1 = validateCore();
      if (e1) return toast.error(e1);
      const e2 = validateCardFromFormData(paymentCard);
      if (e2) return toast.error(e2);

      // 1) Taslak oluştur
      const draft = await createDraft(discountedPrice, false);

      // 2) Tutarı kuruşa çevir
      const amountKurus = Math.round(Number(discountedPrice) * 100);

      // 3) Kart payload (normalize + cvv map)
      const cardPayload = paymentCard
        ? {
            number: String(paymentCard.number || "").replace(/\s+/g, ""),
            name: String(paymentCard.name || "").trim(),
            expireMonth: String(parseInt(paymentCard.expireMonth || "0", 10)),
            expireYear: String(paymentCard.expireYear || ""),
            cvv: String(paymentCard.cvc || ""),
          }
        : undefined;

      const resp = await fetch("/api/payment/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftAppointmentId: draft.id,
          amount: amountKurus, // <— kuruş
          currency: "TRY",
          card: cardPayload,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "3D başlatma hatası");

      router.push(`/payment/3ds?sid=${data.sessionId}`);
    } catch (err: any) {
      toast.error(err?.message || "Ödeme başlatılamadı");
    }
  };
  const agreementItems = useMemo(
    () =>
      lineItems.map((li) => ({
        description: li.name,
        quantity: li.count,
        unitPrice: li.unitPrice,
      })),
    [lineItems]
  );

  const agreementDiscounts = useMemo(() => {
    if (!appliedCoupon) return [];
    const label =
      appliedCoupon.discountType === "PERCENT"
        ? `Kupon -%${appliedCoupon.value}`
        : "Kupon İndirimi";
    const amount =
      appliedCoupon.discountType === "PERCENT"
        ? Math.round((totalPrice * appliedCoupon.value) / 100)
        : appliedCoupon.value;
    return [{ label, amount }];
  }, [appliedCoupon, totalPrice]);

  const from = dateRange?.from ? new Date(dateRange.from) : null;
  const to = dateRange?.to ? new Date(dateRange.to) : null;

  return (
    <Card className="border shadow-md sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg">Sipariş Özeti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        {/* Türler */}
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

        {/* Hizmetler */}
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

        {/* Zaman */}
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

        {/* Kupon ve Toplamlar */}
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

        {/* Sözleşmeler */}
        <AgreementsCheckbox
          value={agreements}
          onChange={setAgreements}
          items={agreementItems}
          shippingFee={0}
          discounts={agreementDiscounts}
          paymentMethod={paymentMethod || "Online Ödeme"}
          deliveryAddress={
            address?.fullAddress || me?.primaryAddress?.fullAddress || ""
          }
          invoiceAddress={
            invoiceAddressText ||
            address?.fullAddress ||
            me?.primaryAddress?.fullAddress ||
            ""
          }
          recipientName={recipientName || me?.name || ""}
          orderDate={from ? format(from, "d.M.yyyy", { locale: tr }) : ""}
          deliveryType="Adrese Hizmet"
          deliveryDeadlineLabel="Hizmet Tarihi"
          deliveryDeadline={
            from && to
              ? `${format(from, "d.M.yyyy", { locale: tr })} - ${format(to, "d.M.yyyy", { locale: tr })}`
              : from
                ? format(from, "d.M.yyyy", { locale: tr })
                : ""
          }
          cargoHandOverLabel="Planlanan Zaman Aralığı"
          cargoHandOverDate={timeSlot ? SLOT_LABELS[timeSlot] || timeSlot : ""}
          buyer={{ name: me?.name || "", email: me?.email || "" }}
          seller={SELLER_INFO}
          platform={PLATFORM_INFO}
        />

        <div className="grid grid-cols-1 gap-2 pt-1">
          <Button
            className="w-full"
            onClick={handleStartLivePayment}
            disabled={!canStartPaid}
          >
            Hizmeti Başlat
          </Button>

          {canTest && (
            <Button
              type="button"
              className="w-full"
              onClick={handleMockPayment}
              disabled={!canStartTest}
            >
              Test Ödeme Yap (Mock)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
