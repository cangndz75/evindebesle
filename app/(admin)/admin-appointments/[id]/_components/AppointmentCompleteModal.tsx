"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Dialog as ServiceDialog,
  DialogTrigger as ServiceDialogTrigger,
  DialogContent as ServiceDialogContent,
  DialogHeader as ServiceDialogHeader,
  DialogTitle as ServiceDialogTitle,
  DialogFooter as ServiceDialogFooter,
} from "@/components/ui/dialog";
import {
  ListChecks,
  CheckCircle2,
  CalendarClock,
  StickyNote,
  CameraIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import AppointmentChecklistForm from "./AppointmentChecklistForm";
import AppointmentCompletionDatePicker from "./AppointmentCompletionDatePicker";
import AppointmentMediaUpload from "./AppointmentMediaUpload";

type UploadedMedia = {
  url: string;
  type: "PHOTO" | "VIDEO" | "AUDIO";
};

type Props = {
  appointmentId: string;
  petId: string;
  petName: string;
  serviceList: {
    id: string;
    name: string;
  }[];
};

export default function AppointmentCompleteModal({
  appointmentId,
  petId,
  petName,
  serviceList,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [completionDate, setCompletionDate] = useState<Date | null>(null);
  const [mediaList, setMediaList] = useState<UploadedMedia[]>([]);
  const [adminNote, setAdminNote] = useState("");

  const handleSave = async () => {
    if (selectedServices.length === 0) {
      return alert("En az bir hizmet seçmelisiniz.");
    }
    if (!completionDate) {
      return alert("Tarih/saat bilgisi eksik.");
    }

    try {
      const res = await fetch("/api/admin/appointments/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          petId,
          completedServiceIds: selectedServices,
          completionDate,
          adminNote,
          media: mediaList,
        }),
      });

      if (!res.ok) throw new Error("Kaydetme başarısız.");

      alert("Randevu başarıyla tamamlandı.");
      setOpen(false);
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Hizmeti Tamamla
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{petName} için Tamamlama Formu</DialogTitle>
          <DialogDescription>
            Hizmeti tamamladıktan sonra kaydedebilirsiniz. Bazı alanlar zorunludur.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Sol Alan: Hizmet, Tarih */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <ListChecks className="w-4 h-4" />
                  Yapılan Hizmetler
                </h4>

                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-muted">
                  {selectedServices.length > 0
                    ? `${selectedServices.length} hizmet seçildi`
                    : "Henüz hizmet seçilmedi"}

                  <ServiceDialog open={showChecklist} onOpenChange={setShowChecklist}>
                    <ServiceDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Seç
                      </Button>
                    </ServiceDialogTrigger>
                    <ServiceDialogContent className="max-w-md">
                      <ServiceDialogHeader>
                        <ServiceDialogTitle>Hizmet Seçimi</ServiceDialogTitle>
                      </ServiceDialogHeader>
                      <ScrollArea className="max-h-[400px] pr-1">
                        <AppointmentChecklistForm
                          serviceList={serviceList}
                          selected={selectedServices}
                          onChange={setSelectedServices}
                        />
                      </ScrollArea>
                      <ServiceDialogFooter className="pt-4">
                        <Button onClick={() => setShowChecklist(false)} className="w-full">
                          Kaydet
                        </Button>
                      </ServiceDialogFooter>
                    </ServiceDialogContent>
                  </ServiceDialog>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <CalendarClock className="w-4 h-4" />
                  Gerçekleşme Tarihi/Saati
                </h4>
                <AppointmentCompletionDatePicker
                  value={completionDate}
                  onChange={setCompletionDate}
                />
              </div>
            </div>

            {/* Sağ Alan: Not + Medya */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <StickyNote className="w-4 h-4" />
                  Admin Notu (Opsiyonel)
                </h4>
                <Textarea
                  placeholder="Bu randevuya özel bir not bırakabilirsiniz..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Separator />

              <div className="space-y-1">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <CameraIcon className="w-4 h-4" />
                  Medya Yükleme (Çoklu - Opsiyonel)
                </h4>
                <AppointmentMediaUpload
                  onUploaded={(file) => setMediaList((prev) => [...prev, file])}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button onClick={handleSave} className="w-full">
            Kaydet ve Tamamla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
