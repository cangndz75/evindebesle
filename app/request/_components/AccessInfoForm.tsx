"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AccessInfoForm({
  appointmentId,
  onClose,
}: {
  appointmentId: string;
  onClose: () => void;
}) {
  const [keyLocation, setKeyLocation] = useState("");
  const [keyInstruction, setKeyInstruction] = useState("");
  const [alarmExists, setAlarmExists] = useState(false);
  const [callBeforeEnter, setCallBeforeEnter] = useState(false);
  const [notifySecurityGuard, setNotifySecurityGuard] = useState(false);
  const [accessNote, setAccessNote] = useState("");
  const [isNeighbor, setIsNeighbor] = useState(false);
  const [neighborName, setNeighborName] = useState("");
  const [neighborFlatNumber, setNeighborFlatNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/access-info", {
      method: "POST",
      body: JSON.stringify({
        appointmentId,
        keyLocation,
        keyInstruction,
        alarmExists,
        callBeforeEnter,
        notifySecurityGuard,
        accessNote,
        neighborName: isNeighbor ? neighborName : null,
        neighborFlatNumber: isNeighbor ? neighborFlatNumber : null,
      }),
    });

    if (res.ok) {
      toast.success("Erişim bilgileri kaydedildi");
      onClose();
    } else {
      toast.error("Kayıt sırasında hata oluştu");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="keyLocation">Anahtar Nerede?</Label>
          <Input
            id="keyLocation"
            placeholder="Örn: Güvenlikte"
            value={keyLocation}
            onChange={(e) => setKeyLocation(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="keyInstruction">Anahtar Talimatı</Label>
          <Textarea
            id="keyInstruction"
            placeholder="Örn: Güvenliğe ismimi söyleyin"
            value={keyInstruction}
            onChange={(e) => setKeyInstruction(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Switch
          checked={alarmExists}
          onCheckedChange={setAlarmExists}
          id="alarmSwitch"
        />
        <Label htmlFor="alarmSwitch">Evde Alarm Var</Label>
      </div>

      <div className="flex items-center gap-4">
        <Switch
          checked={callBeforeEnter}
          onCheckedChange={setCallBeforeEnter}
          id="callBefore"
        />
        <Label htmlFor="callBefore">Girmeden Önce Arayın</Label>
      </div>

      <div className="flex items-center gap-4">
        <Switch
          checked={notifySecurityGuard}
          onCheckedChange={setNotifySecurityGuard}
          id="notifySecurity"
        />
        <Label htmlFor="notifySecurity">Güvenliğe Bilgi Verilsin</Label>
      </div>

      <div className="flex items-center gap-4">
        <Switch
          checked={isNeighbor}
          onCheckedChange={setIsNeighbor}
          id="neighborSwitch"
        />
        <Label htmlFor="neighborSwitch">Anahtar komşuda mı?</Label>
      </div>

      {isNeighbor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="neighborName">Komşu Adı</Label>
            <Input
              id="neighborName"
              placeholder="Örn: Ayşe Teyze"
              value={neighborName}
              onChange={(e) => setNeighborName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="neighborFlat">Daire No</Label>
            <Input
              id="neighborFlat"
              placeholder="Örn: 5B"
              value={neighborFlatNumber}
              onChange={(e) => setNeighborFlatNumber(e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="note">Genel Not</Label>
        <Textarea
          id="note"
          placeholder="Varsa ek notlarınızı yazabilirsiniz"
          value={accessNote}
          onChange={(e) => setAccessNote(e.target.value)}
        />
      </div>

      <div className="pt-2 text-right">
        <Button type="submit" className="w-full md:w-auto">
          Kaydet
        </Button>
      </div>
    </form>
  );
}
