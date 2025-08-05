"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Props = {
  onSaved: () => void;
};

type PetType = {
  id: string;
  name: string;
};

export default function PetAddForm({ onSaved }: Props) {
  const [speciesOptions, setSpeciesOptions] = useState<PetType[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    allergy: [] as string[],
    specialNote: "",
  });

  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [allergyInput, setAllergyInput] = useState("");

  useEffect(() => {
    fetch("/api/pets")
      .then((res) => res.json())
      .then((data) => {
        setSpeciesOptions(data);
        if (data.length > 0) setSelectedSpecies(data[0].id);
      });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !form.allergy.includes(trimmed)) {
      setForm((prev) => ({ ...prev, allergy: [...prev.allergy, trimmed] }));
      setAllergyInput("");
    }
  };

  const removeAllergy = (item: string) => {
    setForm((prev) => ({
      ...prev,
      allergy: prev.allergy.filter((a) => a !== item),
    }));
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await fetch("/api/user-pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        age: form.age ? Number(form.age) : null,
        petId: selectedSpecies,
        image,
        allergy: form.allergy,
        specialNote: form.specialNote || null,
      }),
    });

    setSaving(false);
    setForm({ name: "", age: "", allergy: [], specialNote: "" });
    setImage(null);
    onSaved();
  };

  return (
    <form className="space-y-6 w-full pb-10" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Ad</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Pamuk, Fıstık, vs."
            required
          />
        </div>
        <div>
          <Label htmlFor="age">Yaş</Label>
          <Input
            id="age"
            name="age"
            value={form.age}
            onChange={handleChange}
            type="number"
            min="0"
            max="30"
            placeholder="2"
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-sm font-medium">Tür</Label>
        <RadioGroup
          value={selectedSpecies ?? ""}
          onValueChange={setSelectedSpecies}
          className="flex gap-4"
        >
          {speciesOptions.map((pet) => (
            <div key={pet.id} className="flex items-center gap-2">
              <RadioGroupItem id={pet.id} value={pet.id} />
              <Label htmlFor={pet.id}>{pet.name}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="allergy">Alerji Bilgileri</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="allergy"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAllergy();
                }
              }}
              placeholder="Örn: Tavuk eti"
            />
            <Button type="button" onClick={addAllergy}>
              Ekle
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {form.allergy.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center bg-muted text-sm px-2 py-1 rounded-full"
              >
                <span className="mr-2">{item}</span>
                <button
                  type="button"
                  onClick={() => removeAllergy(item)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="specialNote">Özel Not</Label>
          <Textarea
            id="specialNote"
            name="specialNote"
            value={form.specialNote}
            onChange={handleChange}
            placeholder="Ek bilgi varsa yazın"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="block text-sm font-medium">Görsel</Label>
        {image ? (
          <img
            src={image}
            alt="Pet"
            className="h-24 w-24 object-cover rounded"
          />
        ) : (
          <div className="h-24 w-24 bg-muted flex items-center justify-center text-xs text-muted-foreground rounded">
            Yok
          </div>
        )}
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={saving}
        />
      </div>

      <div className="flex justify-end gap-2 pt-6">
        <Button variant="outline" type="button" onClick={onSaved}>
          İptal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <svg
                className="animate-spin h-4 w-4 mr-2 inline-block text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            </>
          ) : (
            "Kaydet"
          )}
        </Button>
      </div>
    </form>
  );
}
