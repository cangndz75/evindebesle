"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

// ✅ UUID kontrolü için RegEx
const uuidRegex =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

type Props = {
  species: string; // Bu UUID olmalı
  onSaved: () => void;
};

export default function PetAddForm({ species, onSaved }: Props) {
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | null>(null);

  const [hasAllergy, setHasAllergy] = useState(false);
  const [newAllergy, setNewAllergy] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);

  const [hasSensitivity, setHasSensitivity] = useState(false);
  const [sensitivity, setSensitivity] = useState("");
  const [specialNote, setSpecialNote] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const handleDeleteAllergy = (item: string) => {
    setAllergies((prev) => prev.filter((a) => a !== item));
  };

  const handleSubmit = async () => {
    if (!name || age === "" || !gender) {
      toast.error("Zorunlu alanları doldurun.");
      return;
    }

    if (!uuidRegex.test(species)) {
      console.warn("🚫 Geçersiz petId değeri:", species);
      toast.error("Geçersiz hayvan türü ID'si (petId).");
      return;
    }

    const payload = {
      petId: species,
      name,
      age: typeof age === "number" ? age : undefined,
      gender,
      allergy: hasAllergy ? allergies : undefined,
      sensitivity: hasSensitivity ? sensitivity : null,
      specialNote: specialNote || null,
      relation: null,
      allowAdUse: false,
      image: null,
    };

    console.log("📦 Gönderilen Pet:", payload);

    setIsLoading(true);
    try {
      const res = await fetch("/api/user-pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("❌ Backend Hatası:", error);
        toast.error(error.message || "Kayıt başarısız.");
        return;
      }

      toast.success("Evcil hayvan başarıyla eklendi.");
      onSaved();
    } catch (err) {
      console.error("❌ İstek Hatası:", err);
      toast.error("Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
      <div className="space-y-4">
        <div>
          <Label>Dostunuzun Adı</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label>Yaşı</Label>
            <Input
              type="number"
              placeholder="örn. 3"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
            />
          </div>

          <div className="flex-1">
            <Label className="block">Cinsiyet</Label>
            <div className="flex gap-2">
              <Button
                variant={gender === "MALE" ? "default" : "outline"}
                onClick={() => setGender("MALE")}
              >
                Erkek
              </Button>
              <Button
                variant={gender === "FEMALE" ? "default" : "outline"}
                onClick={() => setGender("FEMALE")}
              >
                Dişi
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label>Alerji Var mı?</Label>
          <Switch checked={hasAllergy} onCheckedChange={setHasAllergy} />
        </div>

        {hasAllergy && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="örn. Tavuk, Polen"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
              />
              <Button type="button" onClick={handleAddAllergy}>
                <Plus size={16} />
              </Button>
            </div>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allergies.map((a, i) => (
                  <div
                    key={i}
                    className="bg-muted px-3 py-1 rounded-full flex items-center text-sm"
                  >
                    {a}
                    <button
                      className="ml-2 text-red-500"
                      onClick={() => handleDeleteAllergy(a)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label>Hassasiyet Var mı?</Label>
          <Switch
            checked={hasSensitivity}
            onCheckedChange={setHasSensitivity}
          />
        </div>

        {hasSensitivity && (
          <div>
            <Label>Hassasiyet</Label>
            <Textarea
              placeholder="örn. Yüksek seslerden rahatsız olur."
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label>Özel Not</Label>
          <Textarea
            placeholder="örn. Sadece sabahları mama yer."
            value={specialNote}
            onChange={(e) => setSpecialNote(e.target.value)}
          />
        </div>

        <div className="pt-4">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
