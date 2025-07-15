// app/(account)/profile/pets/[id]/page.tsx
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import Image from "next/image";
import { authConfig } from "@/lib/auth.config";

export default async function PetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authConfig);
  const userId = session?.user.id;

  if (!userId) return notFound();

  const pet = await prisma.ownedPet.findFirst({
    where: {
      id: params.id,
      userId,
    },
    include: {
      appointments: {
        include: {
          services: {
            include: {
              service: true,
            },
          },
        },
      },
    },
  });

  if (!pet) return notFound();

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Evcil Hayvan Detayı</h1>

      <div className="flex items-start gap-6 border p-4 rounded-lg">
        <Image
          src={pet.image || "/pet-placeholder.png"}
          width={120}
          height={120}
          alt="Pet"
          className="rounded-xl object-cover"
        />
        <div>
          <div className="text-lg font-semibold">{pet.name}</div>
          <div className="text-sm text-gray-600">
            {pet.gender && `Cinsiyet: ${pet.gender}`} <br />
            {pet.age && `Yaş: ${pet.age}`} <br />
            {pet.relation && `İlişki: ${pet.relation}`} <br />
            {pet.allergy && `Alerji: ${pet.allergy}`} <br />
            {pet.sensitivity && `Hassasiyet: ${pet.sensitivity}`} <br />
            {pet.specialNote && `Not: ${pet.specialNote}`} <br />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold mb-2">Aldığı Hizmetler</h2>
        {pet.appointments.length === 0 ? (
          <p className="text-gray-500">Henüz hizmet alınmamış.</p>
        ) : (
          <ul className="space-y-2">
            {pet.appointments.map((a) => (
              <li
                key={a.id}
                className="border rounded px-4 py-2 text-sm flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">
                    {a.services.map((s) => s.service.name).join(", ")}
                  </div>
                  {/* <div className="text-xs text-gray-500">
                    {new Date(a.createdAt).toLocaleDateString("tr-TR")}
                  </div> */}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <button className="px-4 py-2 border rounded font-medium hover:bg-gray-50">
          🪪 Pet Kartı Oluştur
        </button>
      </div>
    </div>
  );
}
