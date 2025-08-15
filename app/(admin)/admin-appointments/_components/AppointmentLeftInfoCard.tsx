"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Calendar,
  Clock,
  PawPrint,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppointmentCompleteModal from "../[id]/_components/AppointmentCompleteModal";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type AppointmentWithRelations = {
  id: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED" | string;
  confirmedAt: string;
  repeatInterval?: string | null;
  repeatCount?: number | null;
  fullAddress?: string;
  district?: { name: string } | null;
  pets?: {
    id: string;
    name: string;
    allergy?: string | null;
    sensitivity?: string | null;
    specialRequest?: string | null;
    services: { service: { id: string; name: string } }[];
  }[];
  media?: { id: string; type: "PHOTO" | "VIDEO" | "AUDIO"; url: string }[];
};

const STATUS_TR: Record<string, string> = {
  SCHEDULED: "Planlandı",
  IN_PROGRESS: "Başladı",
  COMPLETED: "Tamamlandı",
  CANCELED: "İptal",
};

export default function AppointmentLeftInfoCard({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [appointment, setAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [status, setStatus] = useState<
    "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED" | string
  >("SCHEDULED");

  // Modal (tamamlama) durumları – mobil ve masaüstü için ayrık kontrol
  const [completeOpenMobile, setCompleteOpenMobile] = useState(false);
  const [completeOpenDesktop, setCompleteOpenDesktop] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/admin/appointments/${appointmentId}`);
        const json = await res.json();
        setAppointment(json?.data || null);
        setStatus(json?.data?.status || "SCHEDULED");
      } catch (err) {
        console.error("Hata:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [appointmentId]);

  const firstPhotoUrl = useMemo(
    () => appointment?.media?.find((m) => m.type === "PHOTO")?.url,
    [appointment]
  );

  const canStart = status === "SCHEDULED";
  const canComplete = status !== "COMPLETED" && status !== "CANCELED";

  const handleStart = async () => {
    try {
      setStarting(true);
      const res = await fetch(
        `/api/admin/appointments/${appointmentId}/start`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notifyUser: true }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Hizmet başlatılamadı.");
      toast.success("Hizmet başlatıldı, kullanıcı bilgilendirildi.");
      setStatus("IN_PROGRESS");
    } catch (e: any) {
      toast.error(e?.message || "Hizmet başlatılamadı.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-6 shadow-sm bg-white space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="border rounded-lg p-6 shadow-sm bg-white space-y-4">
      {/* Üst başlık: Sol başlık + Geri; Sağda (md+) aksiyonlar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Randevu Detayı</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => history.back()}
            aria-label="Geri dön"
          >
            ← Geri
          </Button>
        </div>

        {/* Masaüstü: Geri'nin sağında aksiyonlar */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-9"
            onClick={handleStart}
            disabled={!canStart || starting}
          >
            {starting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Başlatılıyor…
              </>
            ) : (
              <>
                <span className="mr-2">🔔</span>
                Hizmeti Başlat
              </>
            )}
          </Button>

          <Button
            size="sm"
            className="h-9"
            onClick={() => setCompleteOpenDesktop(true)}
            disabled={!canComplete}
          >
            <span className="mr-2">✔️</span>
            Hizmeti Tamamla
          </Button>

          {/* Masaüstü: Modal (harici tetikleyici ile) */}
          <AppointmentCompleteModal
            appointmentId={appointment.id}
            petId={appointment.pets?.[0]?.id || ""}
            petName={appointment.pets?.[0]?.name || ""}
            serviceList={
              appointment.pets?.[0]?.services.map((s) => s.service) || []
            }
            initialStatus={status}
            onCompleted={() => setStatus("COMPLETED")}
            controlledOpen={completeOpenDesktop}
            onControlledOpenChange={setCompleteOpenDesktop}
            renderDesktopTrigger={false}
          />
        </div>
      </div>

      {appointment.pets && appointment.pets.length > 0 ? (
        <Tabs defaultValue={appointment.pets[0].id} className="w-full">
          <TabsList className="flex flex-wrap">
            {appointment.pets.map((pet) => (
              <TabsTrigger key={pet.id} value={pet.id}>
                {pet.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {appointment.pets.map((pet) => (
            <TabsContent key={pet.id} value={pet.id}>
              <div className="space-y-5">
                {/* Başlık + durum etiketi */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
                      <PawPrint className="w-5 h-5 text-muted-foreground" />
                      {pet.name} için Hizmet Detayı
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(
                          new Date(appointment.confirmedAt),
                          "d MMMM yyyy",
                          {
                            locale: tr,
                          }
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(appointment.confirmedAt), "HH:mm", {
                          locale: tr,
                        })}
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="whitespace-nowrap">
                    {STATUS_TR[status] ?? status}
                  </Badge>
                </div>

                {/* Foto */}
                {firstPhotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={firstPhotoUrl}
                    alt="Randevu fotoğrafı"
                    className="w-full h-52 object-cover rounded-lg shadow"
                  />
                )}

                {/* Adres */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Adres</h3>
                  <p className="text-muted-foreground text-sm">
                    {appointment.fullAddress || "Adres bilgisi yok"}
                    {appointment.district?.name &&
                      ` / ${appointment.district.name}`}
                  </p>
                </div>

                <Separator />

                {/* Hizmetler */}
                <div>
                  <h3 className="font-semibold text-sm mb-1">
                    İstenen Hizmetler
                  </h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {pet.services.map((s) => (
                      <li key={s.service.id}>{s.service.name}</li>
                    ))}
                  </ul>
                </div>

                {/* Tekrarlayan hizmet bilgisi */}
                {(appointment.repeatInterval || appointment.repeatCount) && (
                  <div className="flex items-start gap-2">
                    <RefreshCw className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Tekrarlayan Hizmet: </span>
                      {appointment.repeatInterval?.toLocaleUpperCase()}{" "}
                      aralıklarla toplam {appointment.repeatCount} kez
                      yapılacaktır.
                    </div>
                  </div>
                )}

                {/* Alerji / özel istek / hassasiyet */}
                {(pet.allergy || pet.specialRequest) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Alerjiler
                      </h4>
                      {pet.allergy ? (
                        <div className="flex flex-wrap gap-2">
                          {pet.allergy.split(",").map((a, i) => (
                            <span
                              key={i}
                              className="bg-red-100 text-red-700 text-xs rounded px-2 py-1"
                            >
                              {a.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Yok</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-1">Özel İstek</h4>
                      <p className="text-sm text-muted-foreground">
                        {pet.specialRequest || "Belirtilmemiş"}
                      </p>
                    </div>
                  </div>
                )}

                {pet.sensitivity && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">
                      Hassasiyet Bilgisi
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {pet.sensitivity}
                    </p>
                  </div>
                )}

                {/* --- Mobil aksiyon alanı (kartın en altında) --- */}
                <div className="md:hidden">
                  <Separator className="my-2" />
                  <div className="flex flex-col gap-3">
                    <Button
                      className="w-full h-10"
                      variant="secondary"
                      onClick={handleStart}
                      disabled={!canStart || starting}
                    >
                      {starting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Başlatılıyor…
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🔔</span>
                          Hizmeti Başlat
                        </>
                      )}
                    </Button>

                    <Button
                      className="w-full h-10"
                      onClick={() => setCompleteOpenMobile(true)}
                      disabled={!canComplete}
                    >
                      <span className="mr-2">✔️</span>
                      Hizmeti Tamamla
                    </Button>
                  </div>

                  <AppointmentCompleteModal
                    appointmentId={appointment.id}
                    petId={pet.id}
                    petName={pet.name}
                    serviceList={pet.services.map((s) => s.service)}
                    initialStatus={status}
                    onCompleted={() => setStatus("COMPLETED")}
                    controlledOpen={completeOpenMobile}
                    onControlledOpenChange={setCompleteOpenMobile}
                    renderDesktopTrigger={false}
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <p className="text-muted-foreground text-sm">
          Randevuya ait pet bilgisi bulunamadı.
        </p>
      )}
    </div>
  );
}
