import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import clsx from "clsx";

export default function PetReportCardItem({ report }: { report: any }) {
  const {
    id,
    mood,
    behavior,
    mealTime,
    waterIntake,
    sleepStatus,
    walkTime,
    toiletInfo,
    comments,
    appointmentServices = [],
    medias = [],
    appointmentDate,
  } = report;

  if (!report) return null;

  const sectionMap = [
    { label: "Ruh Hali", key: "mood" },
    { label: "Davranış", key: "behavior" },
    { label: "Yemek", key: "mealTime" },
    { label: "Su Tüketimi", key: "waterIntake" },
    { label: "Uyku", key: "sleepStatus" },
    { label: "Yürüyüş", key: "walkTime" },
  ];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("tr-TR");
    } catch {
      return "Tarih bilgisi yok";
    }
  };

  return (
    <Card className="overflow-hidden border">
      <CardContent className="p-6 space-y-4">
        {/* Rapor Tarihi */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Tarih: {formatDate(appointmentDate)}
          </p>
        </div>

        <Separator />

        {/* Mood / Davranış vs */}
        {sectionMap.map((s) => {
          const items: string[] = report[s.key] || [];
          if (!items.length) return null;

          return (
            <div key={s.key}>
              <p className="font-medium">{s.label}</p>
              <div className="flex gap-2 flex-wrap mt-1">
                {items.map((m: string) => (
                  <Badge key={m} variant="secondary">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}

        {/* Tuvalet Bilgisi */}
        {report.toiletInfo && (
          <div>
            <p className="font-medium">Tuvalet Bilgisi</p>
            <p className="text-sm text-muted-foreground mt-1">
              {report.toiletInfo}
            </p>
          </div>
        )}

        {/* Genel Not */}
        {report.comments && (
          <div>
            <p className="font-medium">Genel Not</p>
            <p className="text-sm text-muted-foreground mt-1">
              {report.comments}
            </p>
          </div>
        )}

        {/* Alınan Hizmetler */}
        {appointmentServices.length > 0 && (
          <div>
            <p className="font-medium">Alınan Hizmetler</p>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {appointmentServices.map((s: any) => (
                <div
                  key={s.id}
                  className={clsx(
                    "p-3 border rounded-md text-sm",
                    s.isCompleted ? "border-green-500" : "border-gray-300"
                  )}
                >
                  {s.service.name} – {s.isCompleted ? "Tamamlandı" : "Bekliyor"}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fotoğraflar */}
        {medias.length > 0 && (
          <div>
            <p className="font-medium mb-1">Fotoğraflar</p>
            <div className="flex gap-4 flex-wrap">
              {medias.map((m: any) => (
                <Image
                  key={m.id}
                  src={m.url}
                  alt="Foto"
                  width={100}
                  height={100}
                  className="rounded-md object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
