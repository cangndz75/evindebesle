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
  const [petSpecies, setPetSpecies] = useState("");
  const [petBreed, setPetBreed] = useState("");
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
        petSpecies,
        petBreed,
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
    // Alanları temizle
    setPetName(""); setPetImage(""); setPetSpecies(""); setPetBreed(""); setUserPetName("");
    setAge(""); setGender(""); setRelation(""); setAllergy(""); setSensitivity(""); setSpecialNote(""); setAllowAdUse(false);
    onAdded();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="font-bold mb-3">Yeni Evcil Hayvan</h3>
        <form className="space-y-2" onSubmit={handleSubmit}>
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Pet Adı (Genel)" value={petName} onChange={e => setPetName(e.target.value)} required />
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Pet Türü (Kedi, Köpek...)" value={petSpecies} onChange={e => setPetSpecies(e.target.value)} required />
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Pet Irkı" value={petBreed} onChange={e => setPetBreed(e.target.value)} />
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Kendi İsminiz (Opsiyonel)" value={userPetName} onChange={e => setUserPetName(e.target.value)} />
          <input type="number" className="w-full border rounded px-3 py-2" placeholder="Yaşı" value={age} onChange={e => setAge(e.target.value === "" ? "" : Number(e.target.value))} min={0} />
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Cinsiyet (Dişi/Erkek)" value={gender} onChange={e => setGender(e.target.value)} />
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Aile İlişkisi (Kardeş/Anne/Baba...)" value={relation} onChange={e => setRelation(e.target.value)} />
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Alerji" value={allergy} onChange={e => setAllergy(e.target.value)} />
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Hassasiyet" value={sensitivity} onChange={e => setSensitivity(e.target.value)} />
          <input type="text" className="w-full border rounded px-3 py-2" placeholder="Özel Not" value={specialNote} onChange={e => setSpecialNote(e.target.value)} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allowAdUse} onChange={e => setAllowAdUse(e.target.checked)} />
            Petim reklamda kullanılabilir.
          </label>
          <div className="flex gap-2">
            <button type="button" className="w-full py-2 rounded bg-gray-200" onClick={onClose} disabled={loading}>İptal</button>
            <button type="submit" className="w-full py-2 rounded bg-black text-white" disabled={loading}>{loading ? "Ekleniyor..." : "Ekle"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
