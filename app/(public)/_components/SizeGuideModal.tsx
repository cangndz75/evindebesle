"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

type SizeGuideData = {
  productName: string;
  measurements: {
    size: string;
    chest: number;
    length: number;
    arm: number;
  }[];
  disclaimer?: string;
};

interface SizeGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sizeGuide?: SizeGuideData;
}

export default function SizeGuideModal({
  open,
  onOpenChange,
  sizeGuide,
}: SizeGuideModalProps) {
  // Örnek beden rehberi verisi (veritabanından gelecek)
  const defaultSizeGuide: SizeGuideData = {
    productName: "Ürün",
    measurements: [
      { size: "S", chest: 64, length: 69.5, arm: 57.5 },
      { size: "M", chest: 66, length: 71.5, arm: 58.5 },
      { size: "L", chest: 68, length: 73.5, arm: 59.5 },
      { size: "XL", chest: 70, length: 75.5, arm: 60.5 },
      { size: "2XL", chest: 72, length: 77.5, arm: 61.5 },
      { size: "3XL", chest: 74, length: 79.5, arm: 62.5 },
    ],
    disclaimer: "Kumaşın pamuk likralı özelliğinden dolayı beden ölçülerinde +/- 2cm farklılık görülebilir. Tüm hakları saklıdır.",
  };

  const guide = sizeGuide || defaultSizeGuide;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase text-center mb-6">
            {guide.productName} BEDEN ÖLÇÜ TABLOSU
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ürün Çizimi */}
          <div className="relative w-full h-64 bg-gray-50 flex items-center justify-center border">
            {/* Basit hoodie çizimi */}
            <svg
              viewBox="0 0 200 300"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Hoodie gövde */}
              <rect
                x="50"
                y="80"
                width="100"
                height="180"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
              {/* Kapüşon */}
              <path
                d="M 50 80 Q 50 40 100 40 Q 150 40 150 80"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
              {/* Kollar */}
              <rect
                x="30"
                y="100"
                width="30"
                height="120"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
              <rect
                x="140"
                y="100"
                width="30"
                height="120"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
              {/* Ölçü çizgileri */}
              {/* Göğüs */}
              <line
                x1="50"
                y1="140"
                x2="150"
                y2="140"
                stroke="#999"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <text x="100" y="135" textAnchor="middle" fontSize="10" fill="#666">
                GÖĞÜS (CHEST)
              </text>
              {/* Boy */}
              <line
                x1="100"
                y1="80"
                x2="100"
                y2="260"
                stroke="#999"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <text x="105" y="170" fontSize="10" fill="#666">
                BOY (FULL LENGTH)
              </text>
              {/* Kol */}
              <line
                x1="45"
                y1="100"
                x2="45"
                y2="220"
                stroke="#999"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <text x="25" y="160" fontSize="10" fill="#666">
                KOL (ARM)
              </text>
            </svg>
          </div>

          {/* Ölçü Tablosu */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    Beden
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    GÖĞÜS (CHEST)
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    BOY (LENGTH)
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    KOL (ARM)
                  </th>
                </tr>
              </thead>
              <tbody>
                {guide.measurements.map((measurement, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-4 py-2 font-semibold">
                      {measurement.size}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {measurement.chest} cm
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {measurement.length} cm
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {measurement.arm} cm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Uyarı */}
          {guide.disclaimer && (
            <p className="text-xs text-gray-600 text-center mt-4">
              {guide.disclaimer}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
