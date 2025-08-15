"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ListChecks,
  CalendarClock,
  StickyNote,
  CameraIcon,
  Mic,
  Square,
  Trash2,
  Loader2,
  BadgeCheck,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AppointmentCompletionDatePicker from "./AppointmentCompletionDatePicker";

type UploadedMedia = { url: string; type: "PHOTO" | "VIDEO" | "AUDIO" };

type Props = {
  appointmentId: string;
  petId: string;
  petName: string;
  serviceList: { id: string; name: string }[];
  initialStatus?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | string;
  onCompleted?: () => void;
  controlledOpen?: boolean;
  onControlledOpenChange?: (open: boolean) => void;
  renderDesktopTrigger?: boolean;
};

export default function AppointmentCompleteModal({
  appointmentId,
  petId,
  petName,
  serviceList,
  initialStatus = "SCHEDULED",
  onCompleted,
  controlledOpen,
  onControlledOpenChange,
  renderDesktopTrigger = true,
}: Props) {
  // sm ve üstü desktop kabul
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const handler = () => setIsDesktop(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    mq.addListener?.(handler);
    return () => {
      mq.removeEventListener?.("change", handler);
      mq.removeListener?.(handler);
    };
  }, []);

  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? (controlledOpen as boolean) : internalOpen;
  const setOpen = (v: boolean) =>
    isControlled ? onControlledOpenChange?.(v) : setInternalOpen(v);

  const [selectedServices, setSelectedServices] = useState<string[]>(
    serviceList.map((s) => s.id)
  );
  const [completionDate, setCompletionDate] = useState<Date | null>(new Date());
  const [adminNote, setAdminNote] = useState("");
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);

  const [showNote, setShowNote] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [showAudio, setShowAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (open) {
      setShowNote(false);
      setShowMedia(false);
      setShowAudio(false);
    }
  }, [open]);

  const allSelected = useMemo(
    () => selectedServices.length === serviceList.length,
    [selectedServices.length, serviceList.length]
  );

  const toggleService = (id: string) =>
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const selectAll = () => setSelectedServices(serviceList.map((s) => s.id));
  const selectNone = () => setSelectedServices([]);

  // ---- upload helpers
  const uploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok || !j?.url) throw new Error(j?.error || "Yükleme başarısız.");
    return j.url as string;
  };

  const onPickMedia = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      setUploading(true);
      const list: UploadedMedia[] = [];
      for (const f of Array.from(files)) {
        const isImg = f.type.startsWith("image/");
        const isVid = f.type.startsWith("video/");
        if (!isImg && !isVid) {
          toast.error("Sadece foto/video yükleyebilirsiniz.");
          continue;
        }
        const url = await uploadFile(f);
        list.push({ url, type: isImg ? "PHOTO" : "VIDEO" });
      }
      setMedia((prev) => [...prev, ...list]);
    } catch (e: any) {
      toast.error(e?.message || "Medya yüklenemedi.");
    } finally {
      setUploading(false);
    }
  };

  const removeMediaAt = (i: number) =>
    setMedia((prev) => prev.filter((_, idx) => idx !== i));

  // ---- audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      audioChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data?.size) audioChunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `audio-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        try {
          setUploading(true);
          const url = await uploadFile(file);
          setMedia((prev) => [...prev, { url, type: "AUDIO" }]);
        } catch (e: any) {
          toast.error(e?.message || "Ses kaydı yüklenemedi.");
        } finally {
          setUploading(false);
          stream.getTracks().forEach((t) => t.stop());
        }
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Mikrofon izni gerekli.");
    }
  };
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleSave = async () => {
    if (!selectedServices.length) return toast.error("En az bir hizmet seçin.");
    if (!completionDate) return toast.error("Gerçekleşme tarih/saatini girin.");
    try {
      const res = await fetch(
        `/api/admin/appointments/${appointmentId}/complete`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId,
            petId,
            completedServiceIds: selectedServices,
            completionDate,
            adminNote,
            media,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Kaydetme başarısız.");
      toast.success("Randevu tamamlandı.");
      setOpen(false);
      onCompleted?.();
    } catch (e: any) {
      toast.error(e?.message || "Bir hata oluştu.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {renderDesktopTrigger && !isControlled && (
        <DialogTrigger asChild>
          <Button size="sm" className="h-9">
            <Check className="w-4 h-4 mr-2" /> Hizmeti Tamamla
          </Button>
        </DialogTrigger>
      )}

      {/* Mobilde iki yandan 16px margin; yatay taşma yok */}
      <DialogContent className="p-0 rounded-2xl overflow-hidden box-border w-[min(100dvw-32px,40rem)] max-w-[min(100dvw-32px,40rem)] sm:w-auto sm:max-w-xl md:max-w-2xl">
        <div className="px-4 py-4 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl text-center sm:text-left">
              {petName} için Tamamlama Formu
            </DialogTitle>
            <DialogDescription className="text-center sm:text-left">
              Önce yapılan hizmetleri işaretleyin, ardından tarih/saat girin.
              İsterseniz not, medya ve ses ekleyin.
            </DialogDescription>
          </DialogHeader>

          {/* Yatay scroll kapalı, dikey otomatik */}
          <div className="max-h-[calc(100dvh-200px)] overflow-y-auto overflow-x-hidden">
            <div className="space-y-6">
              {/* 1) Yapılan Hizmetler */}
              <section className="rounded-xl border p-3 sm:p-4 bg-white">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <ListChecks className="w-4 h-4 shrink-0" />
                    <h4 className="font-semibold text-sm sm:text-base truncate">
                      Yapılan Hizmetler
                    </h4>
                  </div>

                  {/* Desktop: sağda toplu seçim; Mobilde aşağı satırda link olarak */}
                  {isDesktop ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3"
                        onClick={allSelected ? selectNone : selectAll}
                      >
                        {allSelected ? (
                          <>
                            <X className="w-4 h-4 mr-1" /> Hiçbiri
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" /> Tümünü Seç
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={allSelected ? selectNone : selectAll}
                      className="text-xs underline underline-offset-2 text-muted-foreground self-start"
                    >
                      {allSelected ? "Hiçbiri" : "Tümünü Seç"}
                    </button>
                  )}
                </header>

                <div className="rounded-md border divide-y">
                  {serviceList.map((s) => {
                    const checked = selectedServices.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        className="w-full p-3 flex items-center gap-3 justify-between cursor-pointer select-none"
                        onClick={() => toggleService(s.id)}
                        role="group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {!isDesktop && (
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleService(s.id)}
                              className="shrink-0"
                            />
                          )}
                          <Label className="text-sm font-medium truncate">
                            {s.name}
                          </Label>
                        </div>

                        {isDesktop && (
                          <Switch
                            checked={checked}
                            onCheckedChange={() => toggleService(s.id)}
                            className="shrink-0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    Seçili: {selectedServices.length}
                  </p>
                </div>
              </section>

              <Separator />

              {/* 2) Tarih/Saat */}
              <section className="rounded-xl border p-3 sm:p-4 bg-white">
                <header className="flex items-center gap-2 mb-2 min-w-0">
                  <CalendarClock className="w-4 h-4 shrink-0" />
                  <h4 className="font-semibold text-sm sm:text-base truncate">
                    Gerçekleşme Tarihi/Saati
                  </h4>
                </header>

                <AppointmentCompletionDatePicker
                  value={completionDate}
                  onChange={setCompletionDate}
                />
              </section>

              <Separator />

              {/* 3) Admin Notu */}
              <section className="rounded-xl border p-3 sm:p-4 bg-white">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <StickyNote className="w-4 h-4 shrink-0" />
                    <h4 className="font-semibold text-sm sm:text-base truncate">
                      Admin Notu (Opsiyonel)
                    </h4>
                  </div>

                  {/* Mobilde tetikleyici aşağı satırda */}
                  {isDesktop ? (
                    <Switch
                      checked={showNote}
                      onCheckedChange={setShowNote}
                      className="shrink-0"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={showNote}
                        onCheckedChange={(v) => setShowNote(!!v)}
                        className="shrink-0"
                      />
                      <span className="text-xs text-muted-foreground">
                        Not Ekle
                      </span>
                    </div>
                  )}
                </header>

                {showNote && (
                  <div className="mt-3">
                    <Textarea
                      placeholder="Bu randevuya özel bir not bırakabilirsiniz…"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="min-h-[90px]"
                    />
                  </div>
                )}
              </section>

              {/* 4) Medya */}
              <section className="rounded-xl border p-3 sm:p-4 bg-white">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <CameraIcon className="w-4 h-4 shrink-0" />
                    <h4 className="font-semibold text-sm sm:text-base truncate">
                      Medya Yükleme (Foto/Video — Çoklu)
                    </h4>
                  </div>

                  {isDesktop ? (
                    <Switch
                      checked={showMedia}
                      onCheckedChange={setShowMedia}
                      className="shrink-0"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={showMedia}
                        onCheckedChange={(v) => setShowMedia(!!v)}
                        className="shrink-0"
                      />
                      <span className="text-xs text-muted-foreground">
                        Medya Ekle
                      </span>
                    </div>
                  )}
                </header>

                {showMedia && (
                  <div className="mt-3 space-y-3">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={(e) => onPickMedia(e.target.files)}
                      className="w-full max-w-full"
                    />

                    {uploading && (
                      <span className="inline-flex items-center text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Yükleniyor…
                      </span>
                    )}

                    {media.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {media.map((m, i) => (
                          <div
                            key={`${m.url}-${i}`}
                            className="relative border rounded-lg overflow-hidden"
                          >
                            {m.type === "PHOTO" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.url}
                                alt="uploaded"
                                className="w-full h-32 object-cover"
                              />
                            ) : m.type === "VIDEO" ? (
                              <video
                                src={m.url}
                                className="w-full h-32 object-cover"
                                controls
                              />
                            ) : (
                              <div className="p-3">
                                <audio
                                  src={m.url}
                                  controls
                                  className="w-full"
                                />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeMediaAt(i)}
                              className="absolute top-1 right-1 bg-white/90 hover:bg-white rounded-full p-1 shadow"
                              title="Kaldır"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                              {m.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* 5) Ses */}
              <section className="rounded-xl border p-3 sm:p-4 bg-white">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mic className="w-4 h-4 shrink-0" />
                    <h4 className="font-semibold text-sm sm:text-base truncate">
                      Ses Kaydı (Tarayıcıdan — Çoklu)
                    </h4>
                  </div>

                  {isDesktop ? (
                    <Switch
                      checked={showAudio}
                      onCheckedChange={setShowAudio}
                      className="shrink-0"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={showAudio}
                        onCheckedChange={(v) => setShowAudio(!!v)}
                        className="shrink-0"
                      />
                      <span className="text-xs text-muted-foreground">
                        Ses Ekle
                      </span>
                    </div>
                  )}
                </header>

                {showAudio && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {!recording ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={startRecording}
                        >
                          <Mic className="w-4 h-4 mr-2" />
                          Kaydı Başlat
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={stopRecording}
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Kaydı Durdur
                        </Button>
                      )}
                      {uploading && (
                        <span className="inline-flex items-center text-xs text-muted-foreground">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Yükleniyor…
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kaydı durdurduğunuzda otomatik yüklenir ve listeye
                      eklenir.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button onClick={handleSave} className="w-full">
              <BadgeCheck className="w-4 h-4 mr-2" />
              Kaydet ve Tamamla
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
