"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, Image, StickyNote } from "lucide-react";

import AppointmentDetailHeader from "./_components/AppointmentDetailHeader";
import CompletedServicesList from "./_components/CompletedServicesList";
import AppointmentTimeline from "./_components/AppointmentTimeline";
import AppointmentMediaTab from "./_components/AppointmentMediaTab";
import AppointmentNotesTab from "./_components/AppointmentNotesTab";
import AppointmentTimelineWrapper from "./_components/AppointmentTimelineWrapper";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/appointments/${id}`)
      .then((res) => res.json())
      .then((res) => setAppointment(res?.data || null))
      .catch(() => setAppointment(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Skeleton className="h-32 w-full mb-6 rounded-md" />
        <Skeleton className="h-10 w-40 mb-4 rounded-md" />
        <Skeleton className="h-96 w-full rounded-md" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center text-muted-foreground">
        Randevu bulunamadı.
        <button
          onClick={() => window.history.back()}
          className="text-primary underline block mt-4"
        >
          Geri dön
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <button
        onClick={() => window.history.back()}
        className="flex items-center text-sm text-muted-foreground hover:text-black transition mb-2"
      >
        <span className="mr-1 text-lg">←</span> Geri dön
      </button>
      <AppointmentDetailHeader
        petName={appointment.ownedPet?.name || "Bilinmiyor"}
        userName={appointment.user?.name || "Bilinmiyor"}
        fullAddress={appointment.address?.fullAddress || ""}
        districtName={appointment.address?.district?.name || ""}
        confirmedAt={appointment.confirmedAt}
        timeSlot={appointment.timeSlot}
        status={appointment.status}
        services={appointment.services.map((s: any) => ({
          name: s.service?.name || "Hizmet",
          isCompleted: s.isCompleted,
        }))}
      />

      <Tabs defaultValue="services">
        <TabsList className="h-auto rounded-none border-b bg-transparent p-0">
          {/* <TabsTrigger
            value="services"
            className="data-[state=active]:after:bg-black relative rounded-none px-4 py-3 font-medium text-base text-muted-foreground data-[state=active]:text-black after:absolute after:inset-x-0 after:bottom-0 after:h-0.5"
          >
            <FileText size={18} className="mr-2" />
            Hizmetler
          </TabsTrigger> */}
          <TabsTrigger
            value="timeline"
            className="data-[state=active]:after:bg-black relative rounded-none px-4 py-3 font-medium text-base text-muted-foreground data-[state=active]:text-black after:absolute after:inset-x-0 after:bottom-0 after:h-0.5"
          >
            <Clock size={18} className="mr-2" />
            Zaman Çizelgesi
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="data-[state=active]:after:bg-black relative rounded-none px-4 py-3 font-medium text-base text-muted-foreground data-[state=active]:text-black after:absolute after:inset-x-0 after:bottom-0 after:h-0.5"
          >
            <Image size={18} className="mr-2" />
            Medyalar
          </TabsTrigger>
          <TabsTrigger
            value="note"
            className="data-[state=active]:after:bg-black relative rounded-none px-4 py-3 font-medium text-base text-muted-foreground data-[state=active]:text-black after:absolute after:inset-x-0 after:bottom-0 after:h-0.5"
          >
            <StickyNote size={18} className="mr-2" />
            Notlar
          </TabsTrigger>
        </TabsList>

        {/* <TabsContent value="services" className="pt-6">
          <CompletedServicesList services={appointment.services} />
        </TabsContent> */}

        <TabsContent value="timeline" className="pt-6">
          <AppointmentTimelineWrapper appointmentId={id as string} />
        </TabsContent>

        <TabsContent value="media" className="pt-6">
          <AppointmentMediaTab media={appointment.media || []} />
        </TabsContent>

        <TabsContent value="note" className="pt-6">
          <AppointmentNotesTab adminNote={appointment.adminNote || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
