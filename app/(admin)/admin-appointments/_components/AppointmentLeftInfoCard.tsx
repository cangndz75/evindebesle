"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Calendar,
  Clock,
  PawPrint,
  StickyNote,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type AppointmentWithRelations = {
  id: string;
  status: string;
  confirmedAt: string;
  repeatInterval?: string | null;
  repeatCount?: number | null;
  adminNote?: string | null;
  fullAddress?: string;
  district?: {
    name: string;
  } | null;
  pets?: {
    id: string;
    name: string;
    image?: string | null;
    allergy?: string | null;
    sensitivity?: string | null;
    specialRequest?: string | null;
    services: {
      service: {
        id: string;
        name: string;
      };
    }[];
  }[];
};

export default function AppointmentLeftInfoCard({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [appointment, setAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/admin/appointments/${appointmentId}`);
        const json = await res.json();
        setAppointment(json?.data || null);
      } catch (err) {
        console.error("Hata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [appointmentId]);

  if (loading) return <div>Yükleniyor...</div>;
  if (!appointment) return null;

  return (
    <div className="border rounded-lg p-6 shadow-sm bg-white space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-bold">Randevu Detayı</div>
        <Button variant="outline" size="sm" onClick={() => history.back()}>
          ← Geri
        </Button>
      </div>

      {(appointment.pets && appointment.pets.length > 0) ? (
        <Tabs defaultValue={appointment.pets[0].id} className="w-full">
          <TabsList>
            {appointment.pets?.map((pet) => (
              <TabsTrigger key={pet.id} value={pet.id}>
                {pet.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {appointment.pets.map((pet) => (
            <TabsContent key={pet.id} value={pet.id}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
                      <PawPrint className="w-4 h-4 text-muted-foreground" />
                      {pet.name} için Hizmet Detayı
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(
                          new Date(appointment.confirmedAt),
                          "d MMMM yyyy",
                          { locale: tr }
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
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline">{appointment.status}</Badge>
                    <Button size="sm" variant="outline">
                      Durumu Değiştir
                    </Button>
                  </div>
                </div>

                {pet.image && (
                  <img
                    src={pet.image}
                    alt="Pet Görseli"
                    className="w-full h-52 object-cover rounded-lg shadow"
                  />
                )}

                <div className="space-y-1">
                  <h3 className="font-semibold text-sm mb-1">Adres</h3>
                  <p className="text-muted-foreground text-sm">
                    {appointment.fullAddress || "Adres bilgisi yok"}
                    {appointment.district?.name &&
                      ` / ${appointment.district.name}`}
                  </p>
                </div>

                <Separator />

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

                {(appointment.repeatInterval || appointment.repeatCount) && (
                  <div className="flex items-start gap-2 mt-2">
                    <RefreshCw className="w-4 h-4 text-muted-foreground mt-1" />
                    <div>
                      <h4 className="font-semibold text-sm mb-0.5">
                        Tekrarlayan Hizmet
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {appointment.repeatInterval?.toLocaleUpperCase()}{" "}
                        aralıklarla toplam {appointment.repeatCount} kez
                        yapılacaktır.
                      </p>
                    </div>
                  </div>
                )}

                {(pet.allergy || pet.specialRequest) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg">
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

                {appointment.adminNote && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                      <StickyNote className="w-4 h-4 text-muted-foreground" />
                      Admin Notu
                    </h4>
                    <textarea
                      className="w-full border rounded px-3 py-2 text-sm bg-muted"
                      value={appointment.adminNote}
                      rows={4}
                      disabled
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-muted-foreground text-sm">
          Randevuya ait pet bilgisi bulunamadı.
        </div>
      )}
    </div>
  );
}
