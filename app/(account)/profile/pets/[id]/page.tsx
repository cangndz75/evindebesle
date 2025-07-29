"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PetEditModal from "../../PetEditModal";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PetDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [services, setServices] = useState<any[]>([]);

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

  const fetchPetServices = async () => {
    try {
      const res = await fetch(`/api/pet-report/${id}`);
      const reports = await res.json();
      const allServices = reports.flatMap(
        (r: any) => r.appointment?.services || []
      );
      setServices(allServices);
    } catch (err) {
      console.error("Hizmet verisi alınamadı:", err);
    }
  };

  const handleDeleteClick = () => setShowDeleteConfirm(true);

  const confirmDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/user-pets/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Evcil hayvan silindi.");
      router.push("/profile/pets");
    } else {
      toast.error("Silme işlemi başarısız oldu.");
      setDeleting(false);
    }

    setShowDeleteConfirm(false);
  };

  useEffect(() => {
    fetchPet();
    fetchPetServices();
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
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-4 right-4"
          onClick={handleDeleteClick}
        >
          Evcil Hayvanı Sil
        </Button>

        <Image
          src={
            pet.image ||
            "https://res.cloudinary.com/dlahfchej/image/upload/v1752619388/8_kkoxpr.png"
          }
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
        <h2 className="text-lg font-bold mb-2">
          Aldığı Hizmetler {services.length > 0 && `(${services.length})`}
        </h2>
        {services.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Henüz hizmet alınmamış.
          </div>
        ) : (
          <ul className="text-sm text-muted-foreground list-disc pl-4">
            {services.map((s, index) => (
              <li key={s.id || index}>
                {s.service?.name}{" "}
                {s.isCompleted && (
                  <span className="text-green-600 ml-1">(Tamamlandı)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <Button
          variant="outline"
          onClick={() => router.push(`/profile/pets/${id}/report`)}
        >
          🪪 Pet Kartı Oluştur
        </Button>
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

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>
              Evcil hayvanı silmek istediğinize emin misiniz?
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-center gap-4 mt-4">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Siliniyor..." : "Sil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
