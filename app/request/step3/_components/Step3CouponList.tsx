"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  description?: string | null;
  discountType: "PERCENT" | "FIXED";
  value: number;
  isActive: boolean;
  expiresAt?: string | null;
  isUsable: boolean;
  minPrice?: number;
  maxDiscount?: number;
};

type Props = {
  selectedCouponCode?: string;
  onApply: (coupon: Coupon) => void;
};

export default function Step3CouponList({
  selectedCouponCode,
  onApply,
}: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user-coupons")
      .then((res) => res.json())
      .then(setCoupons)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>;

  if (coupons.length === 0)
    return (
      <p className="text-sm text-muted-foreground">Tanımlı kupon bulunamadı.</p>
    );

  return (
    <div className="flex flex-wrap gap-4">
      {coupons.map((coupon) => {
        const isSelected = selectedCouponCode === coupon.code;
        const expired =
          coupon.expiresAt && new Date(coupon.expiresAt) < new Date();

        const disabled = !coupon.isUsable || expired;

        return (
          <div
            key={coupon.id}
            className={`w-[200px] rounded-md border p-3 shadow-sm flex flex-col justify-between transition ${
              disabled ? "opacity-40" : "hover:border-primary"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-[11px] px-2 py-0.5">
                {coupon.discountType === "PERCENT"
                  ? `%${coupon.value} İNDİRİM`
                  : `${coupon.value}₺ İNDİRİM`}
              </Badge>
              {isSelected && (
                <CheckCircle2 className="text-green-600 w-4 h-4" />
              )}
            </div>

            <p className="text-xs font-medium line-clamp-2">
              {coupon.description || "Kupon"}
            </p>

            <div className="text-[10px] text-muted-foreground mt-1 space-y-1">
              {coupon.minPrice && <p>Alt Limit: {coupon.minPrice}₺</p>}
              {coupon.maxDiscount && coupon.discountType === "PERCENT" && (
                <p>Maks. İndirim: {coupon.maxDiscount}₺</p>
              )}
              {coupon.expiresAt && (
                <p>
                  Son Kullanım:{" "}
                  {format(new Date(coupon.expiresAt), "d MMM yyyy", {
                    locale: tr,
                  })}
                </p>
              )}
              {expired && (
                <div className="flex items-center text-red-500 font-medium">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Süresi doldu
                </div>
              )}
            </div>

            <Button
              size="sm"
              className="mt-3 w-full text-[12px]"
              disabled={!!disabled}
              onClick={() => {
                if (disabled) {
                  toast.warning("Bu kupon şu anda kullanılamaz.");
                  return;
                }
                onApply(coupon);
              }}
            >
              {isSelected ? "Seçildi" : "Uygula"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
