"use client";

import { CheckCircle, XCircle } from "lucide-react";

type Props = {
  services: {
    id: string;
    service: {
      name: string;
    };
    isCompleted?: boolean | null;
  }[];
};

export default function CompletedServicesList({ services }: Props) {
  return (
    <div className="bg-white p-6 rounded-md border">
      <h2 className="text-lg font-semibold mb-2">Hizmet Listesi</h2>

      {services.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Hizmet bilgisi bulunmamaktadır.
        </p>
      ) : (
        <ul className="space-y-3">
          {services.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between border-b pb-2 last:border-b-0"
            >
              <span className="text-sm">{item.service.name}</span>
              {item.isCompleted ? (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle size={16} />
                  Yapıldı
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500 text-sm">
                  <XCircle size={16} />
                  Yapılmadı
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
