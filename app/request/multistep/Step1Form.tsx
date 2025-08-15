"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MapPin,
  PawPrint,
  CalendarDays,
  PlusIcon,
  CheckCircle2,
  Clock3,
  Repeat,
  Percent,
  CreditCard,
  TestTube,
  KeyRound,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import FilteredServiceSelect from "@/app/(public)/_components/FilteredServiceSelect";
import DatePicker from "@/app/(public)/_components/DatePicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddressForm from "@/app/(account)/profile/addresses/AddressForm";
import { Separator } from "@/components/ui/separator";
import Step1PetAddModal from "../_components/Step1PetAddModal";
import AccessInfoForm, { AccessInfo } from "@/app/(account)/profile/access-info/_components/AccessInfoForm";

interface Props {
  allServices: Service[];
  speciesList: string[];
  selectedBySpecies: Record<string, string[]>;
  setSelectedBySpecies: (data: Record<string, string[]>) => void;
  counts: Record<string, number>;
}

type PetType = { id: string; name: string; image?: string };
type UserPet = {
  id: string;
  userPetName: string;
  petName?: string | null;
  image?: string | null;
  species: string;
};
type Service = {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  petTags: string[];
};
type Address = {
  id: string;
  fullAddress: string;
  districtId: string;
  isPrimary: boolean;
};
type Coupon = {
  id?: string;
  code: string;
  discountType: "PERCENT" | "FIXED" | "AMOUNT";
  value: number;
};

interface Step1FormProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
}

const TIME_SLOTS = [
  { label: "Sabah (08:00 - 12:00)", value: "morning" },
  { label: "Öğle (12:00 - 16:00)", value: "noon" },
  { label: "Akşam (16:00 - 20:00)", value: "evening" },
] as const;

type RepeatType = "none" | "daily" | "weekly" | "monthly";

export default function Step1Form({ setFormData }: Step1FormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "guest";
  const isLoggedIn = Boolean(session?.user?.id);

  const searchParams = useSearchParams();
  const initialSpeciesFromUrl = useMemo(
    () => searchParams.getAll("species"),
    [searchParams]
  );

  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [userPets, setUserPets] = useState<UserPet[]>([]);
  const [selectedUserPetsBySpecies, setSelectedUserPetsBySpecies] = useState<
    Record<string, string[]>
  >({});

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [repeatType, setRepeatType] = useState<RepeatType>("none");
  const [repeatCount, setRepeatCount] = useState<number | null>(null);
  const [repeatModalOpen, setRepeatModalOpen] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [selectedServicesBySpecies, setSelectedServicesBySpecies] = useState<
    Record<string, string[]>
  >({});
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>(
    {}
  );
  const [petAddOpen, setPetAddOpen] = useState(false);
  const [petAddSpecies, setPetAddSpecies] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [loadingAccessInfo, setLoadingAccessInfo] = useState(true);
  const [accessInfoOpen, setAccessInfoOpen] = useState(false);

  const refetchUserPets = async () => {
    setLoadingUserPets(true);
    try {
      const r = await fetch("/api/user-pets");
      const data = await r.json();
      setUserPets(Array.isArray(data) ? data : []);
    } finally {
      setLoadingUserPets(false);
    }
  };
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Payment
  const [cardRaw, setCardRaw] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Loading
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingUserPets, setLoadingUserPets] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const isTestUser = Boolean(session?.user?.isTestUser);

  // Helpers
  const speciesName = (id: string) =>
    petTypes.find((p) => p.id === id)?.name || id;

  const draftKey = useMemo(() => {
    const scope =
      (initialSpeciesFromUrl.length ? initialSpeciesFromUrl : selectedSpecies)
        .slice()
        .sort()
        .join("_") || "all";
    return `requestDraft.${userId}.${scope}.v1`;
  }, [userId, initialSpeciesFromUrl, selectedSpecies]);

  // Load draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const d = JSON.parse(saved);

      setSelectedSpecies((prev) =>
        prev.length ? prev : d.selectedSpecies || []
      );
      setSelectedUserPetsBySpecies(d.selectedUserPetsBySpecies || {});
      setSelectedAddressId(d.selectedAddressId || null);
      setSelectedDates((d.selectedDates || []).map((x: string) => new Date(x)));
      setTimeSlot(d.timeSlot || "");
      setRepeatType(d.repeatType || "none");
      setRepeatCount(d.repeatCount ?? null);
      setSelectedServicesBySpecies(d.selectedServicesBySpecies || {});
      setAppliedCoupon(d.appliedCoupon || null);
    } catch {}
  }, [draftKey]);

  // Save draft
  useEffect(() => {
    const draft = {
      selectedSpecies,
      selectedUserPetsBySpecies,
      selectedAddressId,
      selectedDates,
      timeSlot,
      repeatType,
      repeatCount,
      selectedServicesBySpecies,
      appliedCoupon,
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [
    draftKey,
    selectedSpecies,
    selectedUserPetsBySpecies,
    selectedAddressId,
    selectedDates,
    timeSlot,
    repeatType,
    repeatCount,
    selectedServicesBySpecies,
    appliedCoupon,
  ]);

  // Species from URL
  useEffect(() => {
    if (initialSpeciesFromUrl.length)
      setSelectedSpecies((prev) =>
        prev.length ? prev : initialSpeciesFromUrl
      );
  }, [initialSpeciesFromUrl]);

  // Fetches
  useEffect(() => {
    setLoadingPets(true);
    fetch("/api/pets")
      .then((r) => r.json())
      .then(setPetTypes)
      .finally(() => setLoadingPets(false));
  }, []);

  useEffect(() => {
    setLoadingUserPets(true);
    fetch("/api/user-pets")
      .then(async (r) => (r.status === 401 ? [] : r.ok ? r.json() : []))
      .then((data) => setUserPets(Array.isArray(data) ? data : []))
      .finally(() => setLoadingUserPets(false));
  }, []);

  const refetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const r = await fetch("/api/address");
      const data: Address[] = await r.json();
      setAddresses(data);
      const primary = data.find((a) => a.isPrimary);
      if (primary) setSelectedAddressId(primary.id);
      else if (data.length) setSelectedAddressId(data[0].id);
    } finally {
      setLoadingAddresses(false);
    }
  };
  useEffect(() => {
    refetchAddresses();
  }, []);

  // Services
  useEffect(() => {
    if (!selectedSpecies.length || !petTypes.length) return;
    const params = new URLSearchParams();
    selectedSpecies.forEach((id) => {
      const name = speciesName(id);
      if (name) params.append("species", name);
    });
    setLoadingServices(true);
    fetch(`/api/services/filtered?${params.toString()}`)
      .then((r) => r.json())
      .then(setServices)
      .finally(() => setLoadingServices(false));
  }, [selectedSpecies, petTypes]);

  // UserPet counts
  useEffect(() => {
    const counts: Record<string, number> = {};
    selectedSpecies.forEach((sid) => {
      counts[sid] = selectedUserPetsBySpecies[sid]?.length || 0;
    });
    setServiceCounts(counts);
  }, [selectedSpecies, selectedUserPetsBySpecies]);

  // FormData for summary
  useEffect(() => {
    const selectedAddress =
      addresses.find((a) => a.id === selectedAddressId) || null;

    setFormData((prev: any) => ({
      ...prev,
      selectedSpecies,
      selectedUserPetsBySpecies,
      selectedServicesBySpecies,
      services,
      petTypes,
      address: selectedAddress,
      dateRange:
        selectedDates.length > 0
          ? {
              from: selectedDates[0],
              to: selectedDates[selectedDates.length - 1],
            }
          : null,
      dates: selectedDates,
      timeSlot,
      repeatType,
      repeatCount,
      appliedCoupon,
      accessInfo,
    }));
  }, [
    addresses,
    selectedAddressId,
    selectedSpecies,
    selectedUserPetsBySpecies,
    selectedServicesBySpecies,
    services,
    petTypes,
    selectedDates,
    timeSlot,
    repeatType,
    repeatCount,
    appliedCoupon,
    accessInfo,
    setFormData,
  ]);

  const serviceDayCount = useMemo(() => {
    if (!selectedDates.length) return 0;
    const dayKeys = new Set(
      selectedDates.map((d) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      )
    );
    return dayKeys.size;
  }, [selectedDates]);

  const refetchAccessInfo = async () => {
    setLoadingAccessInfo(true);
    try {
      const res = await fetch("/api/access-info");
      if (!res.ok) {
        setAccessInfo(null);
      } else {
        const data = await res.json();
        setAccessInfo(data || null);
      }
    } catch {
      setAccessInfo(null);
    } finally {
      setLoadingAccessInfo(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) refetchAccessInfo();
  }, [isLoggedIn]);

  const totalPrice = useMemo(() => {
    let base = 0;
    selectedSpecies.forEach((sid) => {
      const count = serviceCounts[sid] || 0;
      if (count < 1) return;
      const chosen = selectedServicesBySpecies[sid] || [];
      chosen.forEach((serviceId) => {
        const svc = services.find((s) => s.id === serviceId);
        if (svc) base += (svc.price || 0) * count;
      });
    });

    const days = Math.max(serviceDayCount, 1);
    return base * days;
  }, [
    selectedSpecies,
    serviceCounts,
    selectedServicesBySpecies,
    services,
    serviceDayCount,
  ]);

  const discountedPrice = useMemo(() => {
    if (!appliedCoupon) return totalPrice;
    if (appliedCoupon.discountType === "PERCENT") {
      const d = (totalPrice * appliedCoupon.value) / 100;
      return Math.max(totalPrice - d, 0);
    }
    return Math.max(totalPrice - appliedCoupon.value, 0);
  }, [appliedCoupon, totalPrice]);

  // Helpers
  const petsOfSpecies = (speciesId: string) => {
    const name = speciesName(speciesId);
    return userPets.filter(
      (p) => p.species === speciesId || p.species === name
    );
  };

  const toggleUserPet = (speciesId: string, userPetId: string) => {
    setSelectedUserPetsBySpecies((prev) => {
      const cur = prev[speciesId] || [];
      const next = cur.includes(userPetId)
        ? cur.filter((x) => x !== userPetId)
        : [...cur, userPetId];
      return { ...prev, [speciesId]: next };
    });
  };

  // Coupon
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const res = await fetch("/api/user-coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data?.error || "Kupon geçersiz.");
      const c: Coupon = data?.coupon || data;
      setAppliedCoupon({
        id: c.id,
        code: c.code,
        discountType: c.discountType === "AMOUNT" ? "AMOUNT" : c.discountType,
        value: c.value,
      });
      toast.success("Kupon uygulandı.");
    } catch {
      toast.error("Kupon kontrol edilemedi.");
    }
  };
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
  };

  // Payment
  const formattedCardNumber = cardRaw.replace(/(.{4})/g, "$1 ").trim();
  const handleCardInput = (v: string) => {
    const digitsOnly = v.replace(/\D/g, "").slice(0, 16);
    setCardRaw(digitsOnly);
  };

  const validatePayForm = () => {
    if (!selectedAddressId) return "Lütfen adres seçin.";
    if (!selectedDates.length) return "Lütfen tarih aralığı seçin.";
    const totalPets = Object.values(selectedUserPetsBySpecies).reduce(
      (s, arr) => s + (arr?.length || 0),
      0
    );
    if (totalPets < 1) return "Lütfen evcil hayvan seçin.";
    const anyService = Object.values(selectedServicesBySpecies).some(
      (arr) => (arr?.length || 0) > 0
    );
    if (!anyService) return "Lütfen en az bir hizmet seçin.";
    if (!timeSlot) return "Lütfen saat aralığı seçin.";
    if (discountedPrice <= 0) return "Tutar 0 olamaz.";
    if (!cardRaw || !cardName || !expiryMonth || !expiryYear || !cvv)
      return "Kart bilgilerini doldurun.";
    if (cardRaw.length !== 16) return "Kart numarası 16 hane olmalı.";
    if (cvv.length !== 3) return "CVV 3 hane olmalı.";
    const cy = new Date().getFullYear();
    if (
      Number(expiryYear) < cy ||
      Number(expiryMonth) < 1 ||
      Number(expiryMonth) > 12
    )
      return "Geçersiz son kullanma tarihi.";
    return null;
  };

  const buildDraftBody = () => {
    const ownedPetIds = Object.values(selectedUserPetsBySpecies).flat();
    const serviceIds = Array.from(
      new Set(Object.values(selectedServicesBySpecies).flat())
    );
    const dates = selectedDates.map((d) => d.toISOString());
    const userAddressId = selectedAddressId!;
    const isRecurring = repeatType !== "none";

    return {
      ownedPetIds,
      serviceIds,
      dates,
      userAddressId,
      timeSlot,
      isRecurring,
      recurringType: isRecurring ? repeatType : undefined,
      recurringCount: isRecurring ? (repeatCount ?? undefined) : undefined,
    };
  };

  const createDraft = async () => {
    const body = buildDraftBody();
    const res = await fetch("/api/draft-appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      console.warn("⚠️ Geçersiz veri:", data?.details || data);
      throw new Error(data?.error || "Taslak oluşturulamadı");
    }
    return (
      data?.data?.draftAppointmentId || data?.draftAppointmentId || data?.id
    );
  };

  const handleCreateDraftWithoutPayment = async () => {
    try {
      if (!selectedAddressId) return toast.error("Adres seçin.");
      if (!selectedDates.length) return toast.error("Tarih seçin.");
      const totalPets = Object.values(selectedUserPetsBySpecies).reduce(
        (s, arr) => s + (arr?.length || 0),
        0
      );
      if (totalPets < 1) return toast.error("Evcil hayvan seçin.");
      const anyService = Object.values(selectedServicesBySpecies).some(
        (arr) => (arr?.length || 0) > 0
      );
      if (!anyService) return toast.error("Hizmet seçin.");
      if (!timeSlot) return toast.error("Saat aralığı seçin.");

      const draftAppointmentId = await createDraft();
      toast.success(`Taslak oluşturuldu (test): ${draftAppointmentId}`);

      const appointmentRes = await fetch("/api/appointments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftAppointmentId,
          paidPrice: 0,
          conversationId: "TEST-MODE",
        }),
      });

      if (!appointmentRes.ok) {
        let errMsg = "Test randevusu oluşturulamadı";
        try {
          const errData = await appointmentRes.json();
          errMsg = errData?.error || errMsg;
        } catch {}
        return toast.error(errMsg);
      }

      toast.success("Test randevusu oluşturuldu ve tabloya eklendi.");
    } catch (e: any) {
      toast.error(e?.message || "Randevu hatası.");
    }
  };

  // --- Render ---
  return (
    <div className="space-y-10 overflow-x-hidden pb-8">
      {" "}
      {/* overflow fix + alt boşluk */}
      {/* Evcil hayvanlarım */}
      <div className="space-y-6">
        <Label className="flex items-center gap-2">
          <PawPrint className="w-4 h-4" /> Evcil Hayvanlarım
        </Label>

        {loadingPets || loadingUserPets ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-24 w-24 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : selectedSpecies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tür seçimi URL parametresiyle gelmeli (ör. <code>?species=...</code>
            ).
          </p>
        ) : (
          <div className="space-y-8">
            {selectedSpecies.map((spId) => {
              const list = petsOfSpecies(spId);
              const chosen = selectedUserPetsBySpecies[spId] || [];
              return (
                <div key={spId} className="border rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold">
                      {speciesName(spId)}
                    </h3>
                    {isLoggedIn && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPetAddSpecies(spId);
                          setPetAddOpen(true);
                        }}
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        {speciesName(spId)} Ekle
                      </Button>
                    )}
                  </div>

                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {isLoggedIn
                        ? "Bu tür için kayıtlı evcil hayvanınız yok. Yukarıdan ekleyebilirsiniz."
                        : "Bu tür için kayıtlı evcil hayvanınız yok. Evcil hayvan eklemek için giriş yapın."}
                    </p>
                  ) : (
                    <div
                      className="max-h-[220px] overflow-y-auto -mr-1 pr-1"
                      style={{ WebkitOverflowScrolling: "touch" }}
                    >
                      <div className="flex flex-wrap gap-3">
                        {list.map((p) => {
                          const isActive = chosen.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => toggleUserPet(spId, p.id)}
                              className={`relative w-36 rounded-xl border bg-white p-3 text-left shadow-sm transition ${
                                isActive
                                  ? "border-lime-500 ring-2 ring-lime-300"
                                  : "border-gray-200 hover:shadow"
                              }`}
                            >
                              <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-50 mb-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={p.image || "/placeholder.jpg"}
                                  alt={
                                    p.userPetName || p.petName || "Evcil Hayvan"
                                  }
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-sm font-medium truncate">
                                {p.userPetName || p.petName || "Evcil Hayvan"}
                              </div>
                              {isActive && (
                                <CheckCircle2 className="absolute top-2 right-2 text-lime-500 w-5 h-5 bg-white rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Adres */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Adres
        </Label>

        {loadingAddresses ? (
          <Skeleton className="h-10 w-full" />
        ) : addresses.length === 0 ? (
          <div className="border rounded-xl p-4 bg-white">
            <p className="text-sm text-muted-foreground mb-3">
              Kayıtlı adresiniz yok.{" "}
              {isLoggedIn ? "Yeni adres ekleyin." : "Lütfen giriş yapın."}
            </p>
            {isLoggedIn && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddressModalOpen(true)}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Adres Ekle
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className="flex items-center gap-3 border rounded-xl p-3 bg-white cursor-pointer"
              >
                <input
                  type="radio"
                  name="userAddress"
                  checked={selectedAddressId === a.id}
                  onChange={() => setSelectedAddressId(a.id)}
                />
                <span className="text-sm">{a.fullAddress}</span>
                {a.isPrimary && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded bg-lime-100 text-lime-800">
                    Varsayılan
                  </span>
                )}
              </label>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddressModalOpen(true)}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Yeni Adres Ekle
            </Button>
          </div>
        )}

        <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Adres Ekle</DialogTitle>
            </DialogHeader>
            <AddressForm
              loading={false}
              onSubmit={async (values) => {
                try {
                  await fetch("/api/address", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(values),
                  });
                  await refetchAddresses();
                  toast.success("Adres eklendi.");
                  setAddressModalOpen(false);
                } catch {
                  toast.error("Adres eklenemedi.");
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      {isLoggedIn && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Erişim Bilgilerim
          </Label>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Evinize erişim için anahtar/şifre gibi bilgiler.
            </p>
            <Button onClick={() => setAccessInfoOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              {accessInfo ? "Düzenle" : "Ekle"}
            </Button>
          </div>

          {loadingAccessInfo ? (
            <Skeleton className="h-16 w-full" />
          ) : accessInfo ? (
            <div className="border rounded-lg p-4 space-y-3 text-sm bg-white">
              <div>
                <strong>Anahtar:</strong> {accessInfo.keyLocation}
              </div>
              {accessInfo.keyInstruction && (
                <div>
                  <strong>Açıklama:</strong> {accessInfo.keyInstruction}
                </div>
              )}
              {accessInfo.doorPassword && (
                <div>
                  <strong>Kapı Şifresi:</strong> {accessInfo.doorPassword}
                </div>
              )}
              {accessInfo.doorNote && (
                <div>
                  <strong>Kapı Notu:</strong> {accessInfo.doorNote}
                </div>
              )}
              {accessInfo.alarmExists && (
                <div>
                  <strong>Alarm:</strong> Var (
                  {accessInfo.alarmRoom || "Oda belirtilmemiş"})
                </div>
              )}
              {accessInfo.keyPhotoUrl && (
                <div>
                  <strong>Fotoğraf:</strong>
                  <img
                    src={accessInfo.keyPhotoUrl}
                    alt="Anahtar Foto"
                    className="w-32 mt-2 rounded border"
                  />
                </div>
              )}
              {accessInfo.accessNote && (
                <div>
                  <strong>Genel Not:</strong> {accessInfo.accessNote}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Herhangi bir erişim bilginiz yok.
            </p>
          )}

          <Dialog open={accessInfoOpen} onOpenChange={setAccessInfoOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {accessInfo ? "Bilgiyi Düzenle" : "Yeni Erişim Bilgisi Ekle"}
                </DialogTitle>
              </DialogHeader>
              <AccessInfoForm
                defaultData={accessInfo ?? undefined}
                onSaved={async () => {
                  setAccessInfoOpen(false);
                  await refetchAccessInfo();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
      {/* Tarih + Saat + Tekrar */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Tarih Aralığı
          </Label>
          <DatePicker selected={selectedDates} onSelect={setSelectedDates} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock3 className="w-4 h-4" /> Saat Aralığı
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setTimeSlot(slot.value)}
                  className={`border rounded-md px-3 py-2 text-sm ${
                    timeSlot === slot.value
                      ? "border-lime-500 ring-2 ring-lime-300"
                      : "hover:bg-muted"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Repeat className="w-4 h-4" /> Tekrar
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRepeatModalOpen(true)}
              >
                Tekrar Ayarla
              </Button>
              <div className="text-sm text-muted-foreground">
                {repeatType === "none"
                  ? "Tek seferlik"
                  : `${repeatType}${repeatCount ? ` • ${repeatCount} kez` : ""}`}
              </div>
            </div>
          </div>
        </div>

        <Dialog open={repeatModalOpen} onOpenChange={setRepeatModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tekrar Ayarları</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Tek Seferlik", value: "none" },
                  { label: "Günlük", value: "daily" },
                  { label: "Haftalık", value: "weekly" },
                  { label: "Aylık", value: "monthly" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRepeatType(opt.value as RepeatType)}
                    className={`border rounded-md px-3 py-2 text-sm ${
                      repeatType === opt.value
                        ? "border-lime-500 ring-2 ring-lime-300"
                        : "hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {repeatType !== "none" && (
                <div>
                  <Label className="block mb-1">Toplam tekrar sayısı</Label>
                  <Input
                    type="number"
                    min={1}
                    value={repeatCount || ""}
                    onChange={(e) =>
                      setRepeatCount(
                        isNaN(Number(e.target.value))
                          ? null
                          : Number(e.target.value)
                      )
                    }
                    className="w-32 text-[16px] h-11" /* iOS zoom fix */
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setRepeatModalOpen(false)}
                >
                  Kapat
                </Button>
                <Button onClick={() => setRepeatModalOpen(false)}>
                  Kaydet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Hizmetler */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <PawPrint className="w-4 h-4" /> Hizmetler
        </Label>

        {/* Mobilde nested scroll yok */}
        <div className="md:hidden border rounded-md p-4 bg-white">
          {loadingServices ? (
            <Skeleton className="w-full h-20" />
          ) : (
            <FilteredServiceSelect
              allServices={services}
              speciesList={petTypes.filter((pt) =>
                selectedSpecies.includes(pt.id)
              )}
              selectedBySpecies={selectedServicesBySpecies}
              setSelectedBySpecies={setSelectedServicesBySpecies}
              counts={serviceCounts}
            />
          )}
        </div>

        {/* md+ için ScrollArea */}
        <ScrollArea
          className="hidden md:block h-auto max-h-[420px] border rounded-md p-4 bg-white"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {loadingServices ? (
            <Skeleton className="w-full h-20" />
          ) : (
            <FilteredServiceSelect
              allServices={services}
              speciesList={petTypes.filter((pt) =>
                selectedSpecies.includes(pt.id)
              )}
              selectedBySpecies={selectedServicesBySpecies}
              setSelectedBySpecies={setSelectedServicesBySpecies}
              counts={serviceCounts}
            />
          )}
        </ScrollArea>
      </div>
      {/* Ayırıcı */}
      <Separator className="my-6" />
      {/* Kupon + ödeme formu */}
      <div className="space-y-6 border rounded-2xl p-6 bg-white">
        {/* Kupon */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Percent className="w-4 h-4" /> Kupon
          </Label>

          <div className="flex gap-2">
            <Input
              placeholder="Kupon kodu"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="text-[16px] h-11" /* iOS zoom fix */
            />
            {appliedCoupon ? (
              <Button variant="secondary" onClick={handleRemoveCoupon}>
                Kaldır
              </Button>
            ) : (
              <Button onClick={handleApplyCoupon}>Uygula</Button>
            )}
          </div>
          {appliedCoupon && (
            <p className="text-sm text-muted-foreground">
              Uygulanan: <strong>{appliedCoupon.code}</strong>{" "}
              {appliedCoupon.discountType === "PERCENT"
                ? `%${appliedCoupon.value}`
                : `-${appliedCoupon.value}₺`}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-lg">
          <div>
            <span className="text-muted-foreground">Toplam: </span>
            <span className="font-semibold">
              {discountedPrice.toLocaleString()}₺
            </span>
            {appliedCoupon && (
              <span className="text-sm line-through text-muted-foreground ml-2">
                {totalPrice.toLocaleString()}₺
              </span>
            )}
          </div>
        </div>

        {/* Kart */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Kart Bilgileri
          </Label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Kart Numarası</Label>
              <Input
                value={formattedCardNumber}
                onChange={(e) => handleCardInput(e.target.value)}
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                autoComplete="cc-number"
                maxLength={19}
                className="text-[16px] h-11" /* iOS zoom fix */
              />
            </div>
            <div>
              <Label>Kart Üzerindeki İsim</Label>
              <Input
                value={cardName}
                onChange={(e) =>
                  setCardName(
                    e.target.value.replace(/[^A-Za-zÇçĞğİıÖöŞşÜü\s]/g, "")
                  )
                }
                placeholder="Ad Soyad"
                autoComplete="cc-name"
                className="text-[16px] h-11" /* iOS zoom fix */
              />
            </div>
            <div>
              <Label>Ay</Label>
              <select
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-[16px] h-11 bg-white" /* iOS zoom fix */
              >
                <option value="">Ay</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const m = String(i + 1).padStart(2, "0");
                  return (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <Label>Yıl</Label>
              <select
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-[16px] h-11 bg-white" /* iOS zoom fix */
              >
                <option value="">Yıl</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const y = new Date().getFullYear() + i;
                  return (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <Label>CVV</Label>
              <Input
                value={cvv}
                onChange={(e) =>
                  setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                }
                placeholder="CVV"
                maxLength={3}
                inputMode="numeric"
                autoComplete="cc-csc"
                className="text-[16px] h-11" /* iOS zoom fix */
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2">
          {isTestUser && (
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
              onClick={handleCreateDraftWithoutPayment}
            >
              <TestTube className="w-4 h-4 mr-2" />
              Test (Ödeme Atlansın)
            </Button>
          )}
        </div>
      </div>
      <Step1PetAddModal
        open={petAddOpen}
        species={petAddSpecies ?? undefined}
        onClose={() => setPetAddOpen(false)}
        onAdded={async () => {
          await refetchUserPets();
          setPetAddOpen(false);
          toast.success("Evcil hayvan eklendi.");
        }}
      />
    </div>
  );
}
