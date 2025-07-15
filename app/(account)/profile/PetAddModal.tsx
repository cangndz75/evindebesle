"use client";
import { useState } from "react";

export default function PetAddModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [petName, setPetName] = useState("");
  const [petImage, setPetImage] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [userPetName, setUserPetName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");
  const [relation, setRelation] = useState("");
  const [allergy, setAllergy] = useState("");
  const [sensitivity, setSensitivity] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [allowAdUse, setAllowAdUse] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petName,
        petImage,
        species,
        breed,
        userPetName,
        age: age ? Number(age) : undefined,
        gender,
        relation,
        allergy,
        sensitivity,
        specialNote,
        allowAdUse,
      }),
    });
    setLoading(false);
    setPetName("");
    setPetImage("");
    setSpecies("");
    setBreed("");
    setUserPetName("");
    setAge("");
    setGender("");
    setRelation("");
    setAllergy("");
    setSensitivity("");
    setSpecialNote("");
    setAllowAdUse(false);
    onAdded();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="font-bold mb-3">Yeni Evcil Hayvan</h3>
        <form className="space-y-2" onSubmit={handleSubmit}>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Pet Adı"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            required
          />
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Tür (Kedi, Köpek...)"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            required
          />
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Irk"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Siz nasıl çağırıyorsunuz?"
            value={userPetName}
            onChange={(e) => setUserPetName(e.target.value)}
          />
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            placeholder="Yaşı"
            value={age}
            onChange={(e) =>
              setAge(e.target.value === "" ? "" : Number(e.target.value))
            }
            min={0}
          />
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Cinsiyet"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          />
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Aile İlişkisi"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
          />
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Alerji"
            value={allergy}
            onChange={(e) => setAllergy(e.target.value)}
          />
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Hassasiyet"
            value={sensitivity}
            onChange={(e) => setSensitivity(e.target.value)}
          />
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Özel Not"
            value={specialNote}
            onChange={(e) => setSpecialNote(e.target.value)}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowAdUse}
              onChange={(e) => setAllowAdUse(e.target.checked)}
            />
            Petim reklamda kullanılabilir.
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="w-full py-2 rounded bg-gray-200"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="w-full py-2 rounded bg-black text-white"
              disabled={loading}
            >
              {loading ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
