"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddCouponModal from "./AddCouponModal";

export default function CouponsClient() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/user-coupons", { cache: "no-store" });
      const data = await res.json();
      setCoupons(data || []);
    } catch (err) {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kuponlarım</h1>
        <AddCouponModal onSuccess={fetchCoupons} />
      </div>

      {loading ? (
        <p>Yükleniyor...</p>
      ) : coupons.length === 0 ? (
        <p>Henüz bir kuponunuz bulunmamaktadır.</p>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon: any) => {
            const {
              id,
              code,
              description,
              discountType,
              value,
              isActive,
              expiresAt,
              usedAt,
              isUsable,
            } = coupon;

            const statusText = isUsable
              ? "Kullanılabilir"
              : !isActive
                ? "Pasif"
                : expiresAt && new Date(expiresAt) < new Date()
                  ? "Süresi Dolmuş"
                  : "Kullanılmış";

            const statusVariant =
              statusText === "Kullanılabilir"
                ? "default"
                : statusText === "Pasif"
                  ? "destructive"
                  : "secondary";

            return (
              <Card key={id}>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge className="text-base px-2 py-1">{code}</Badge>
                    <span className="text-muted-foreground text-sm">
                      {description}
                    </span>
                  </CardTitle>
                  {expiresAt && (
                    <span className="text-sm text-muted-foreground">
                      Son kullanım:{" "}
                      {format(new Date(expiresAt), "d MMMM yyyy", {
                        locale: tr,
                      })}
                    </span>
                  )}
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>
                    İndirim:{" "}
                    <strong>
                      {discountType === "PERCENT" ? `%${value}` : `${value} TL`}
                    </strong>
                  </p>
                  {usedAt && (
                    <p>
                      Kullanım Tarihi:{" "}
                      {format(new Date(usedAt), "d MMMM yyyy HH:mm", {
                        locale: tr,
                      })}
                    </p>
                  )}
                  <p>
                    Durum: <Badge variant={statusVariant}>{statusText}</Badge>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
