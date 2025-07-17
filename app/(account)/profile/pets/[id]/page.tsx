"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PetEditModal from "../../PetEditModal";

export default function PetDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPet = async () => {
    try {
      const res = await fetch("/api/user-pets");
      const allPets = await res.json();
      const found = allPets.find((p: any) => p.id === id);
      setPet(found);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Evcil hayvanı silmek istediğinize emin misiniz?")) return;
    setDeleting(true);
    const res = await fetch(`/api/user-pets/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/account/profile");
    } else {
      alert("Silme işlemi başarısız oldu");
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchPet();
  }, [id]);

  if (loading)
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-28 h-28 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );

  if (!pet)
    return <p className="text-center mt-10">Evcil hayvan bulunamadı.</p>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">{pet.userPetName || pet.petName}</h1>
      </div>

      <div className="relative border p-4 rounded-lg flex items-start gap-6">
        {/* SİLME BUTONU */}
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-4 right-4"
          onClick={handleDelete}
        >
          {deleting ? (
            <svg
              className="animate-spin h-4 w-4 mr-2"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <>Evcil Hayvanı Sil</>
          )}
        </Button>

        <Image
          src={pet.image || "/https://res.cloudinary.com/dlahfchej/image/upload/v1752619388/8_kkoxpr.png"}
          width={120}
          height={120}
          alt="Pet"
          className="rounded-xl object-cover"
        />

        <div className="space-y-2 text-sm text-gray-700 w-full">
          <div className="font-semibold text-lg">
            {pet.userPetName || pet.petName}
          </div>
          {pet.age && <p>Yaş: {pet.age}</p>}
          {pet.gender && <p>Cinsiyet: {pet.gender}</p>}
          {pet.relation && <p>İlişki: {pet.relation}</p>}
          {pet.allergy && <p>Alerji: {pet.allergy}</p>}
          {pet.sensitivity && <p>Hassasiyet: {pet.sensitivity}</p>}
          {pet.specialNote && <p>Not: {pet.specialNote}</p>}

          <div className="mt-3">
            <Button
              variant="outline"
              onClick={() => setOpenEdit(true)}
              className="flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Düzenle
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold mb-2">Aldığı Hizmetler</h2>
        <div className="text-sm text-muted-foreground">
          Henüz hizmet alınmamış.
        </div>
      </div>

      <div className="mt-10">
        <Button variant="outline">🪪 Pet Kartı Oluştur</Button>
      </div>

      <PetEditModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        pet={pet}
        onUpdated={() => {
          setOpenEdit(false);
          setLoading(true);
          fetchPet();
        }}
      />
    </div>
  );
}
