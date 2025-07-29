"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import PetReportCardItem from "./PetReportCardItem";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// @ts-ignore
const html2pdf = require("html2pdf.js") as any;

interface Props {
  petId: string;
}

export default function PetReportCardList({ petId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/pet-report?petId=${petId}`);
        if (!res.ok) {
          throw new Error("Raporlar alınamadı.");
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError("Raporlar yüklenirken hata oluştu.");
        console.error(err);
        toast.error("Raporlar yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [petId]);

  const handleDownload = () => {
    if (!pdfRef.current || !data?.pet) return;

    html2pdf()
      .from(pdfRef.current)
      .set({
        margin: 10,
        filename: `${data.pet.userPetName || data.pet.petName}-karnesi.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .save();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-muted-foreground text-sm">
        {error}
      </div>
    );
  }

  if (!data || !data.pet || data.reports.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">🐾 Raporlar</h1>
        </div>
        <div className="text-muted-foreground text-sm">
          Henüz rapor bulunamadı.
        </div>
      </div>
    );
  }

  const { pet, reports } = data;

  return (
    <div className="space-y-6">
      {/* ÜST BAŞLIK */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            🐾 {pet.userPetName || pet.petName} Karnesi
          </h1>
        </div>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          PDF İndir
        </Button>
      </div>

      {/* PDF OLUŞTURULACAK ALAN */}
      <div ref={pdfRef} className="space-y-6">
        {reports.map((report: any) => (
          <PetReportCardItem
            key={report.petReport.id}
            report={{
              id: report.petReport.id,
              mood: report.petReport.mood,
              behavior: report.petReport.behavior,
              mealTime: report.petReport.mealTime,
              waterIntake: report.petReport.waterIntake,
              sleepStatus: report.petReport.sleepStatus,
              walkTime: report.petReport.walkTime,
              toiletInfo: report.petReport.toiletInfo,
              comments: report.petReport.comments,
              appointmentServices: report.appointmentServices,
              medias: report.medias,
              appointmentDate: report.appointmentDate,
            }}
          />
        ))}
      </div>
    </div>
  );
}