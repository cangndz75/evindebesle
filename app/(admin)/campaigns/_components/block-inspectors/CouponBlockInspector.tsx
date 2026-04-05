"use client";

import { useState, useEffect } from "react";
import { Block } from "../../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { differenceInDays, format } from "date-fns";
import { tr } from "date-fns/locale";

interface CouponBlockInspectorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

interface CouponFromDB {
  id: string;
  code: string;
  description?: string | null;
  discountType: "PERCENT" | "AMOUNT";
  value: number;
  expiresAt?: string | null;
  isActive: boolean;
}

export default function CouponBlockInspector({
  block,
  onUpdate,
}: CouponBlockInspectorProps) {
  const [coupons, setCoupons] = useState<CouponFromDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/admin/coupons");
      if (response.ok) {
        const data = await response.json();
        setCoupons(Array.isArray(data) ? data : data.coupons || []);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateContent = (key: string, value: unknown) => {
    onUpdate({
      content: { ...block.content, [key]: value },
    });
  };

  const updateStyle = (key: string, value: unknown) => {
    onUpdate({
      style: { ...block.style, [key]: value },
    });
  };

  const handleCouponSelect = (couponId: string) => {
    if (couponId === "manual") {
      updateContent("selectedCouponId", null);
      updateContent("couponCode", "");
      updateContent("validityText", "");
      updateContent("discountText", "");
      return;
    }

    const coupon = coupons.find((c) => c.id === couponId);
    if (!coupon) return;

    updateContent("selectedCouponId", coupon.id);
    updateContent("couponCode", coupon.code);

    if (coupon.expiresAt) {
      const expiresDate = new Date(coupon.expiresAt);
      const daysLeft = differenceInDays(expiresDate, new Date());

      if (daysLeft > 0) {
        updateContent("validityText", `${daysLeft} gün geçerli (${format(expiresDate, "d MMMM yyyy", { locale: tr })} tarihine kadar)`);
      } else if (daysLeft === 0) {
        updateContent("validityText", "Bugün son gün!");
      } else {
        updateContent("validityText", "Süresi dolmuş");
      }
    } else {
      updateContent("validityText", "Süresiz geçerli");
    }

    const discountText =
      coupon.discountType === "PERCENT"
        ? `%${coupon.value} İndirim`
        : `${coupon.value} TL İndirim`;
    updateContent("discountText", discountText);
  };

  const selectedCoupon = coupons.find(
    (c) => c.id === block.content.selectedCouponId
  );

  return (
    <div className="space-y-4">
      
      <div>
        <Label className="text-xs font-medium text-gray-700">
          Veritabanından Kupon Seç
        </Label>
        <Select
          value={block.content.selectedCouponId || "manual"}
          onValueChange={handleCouponSelect}
          disabled={isLoading}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder={isLoading ? "Yükleniyor..." : "Kupon seçin"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manuel Giriş</SelectItem>
            {coupons
              .filter((c) => c.isActive)
              .map((coupon) => (
                <SelectItem key={coupon.id} value={coupon.id}>
                  {coupon.code} -{" "}
                  {coupon.discountType === "PERCENT"
                    ? `%${coupon.value}`
                    : `${coupon.value} TL`}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      
      {selectedCoupon && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
          <p className="font-medium text-green-800">
            {selectedCoupon.code}
          </p>
          {selectedCoupon.description && (
            <p className="text-green-700 text-xs mt-1">
              {selectedCoupon.description}
            </p>
          )}
          <p className="text-green-600 text-xs mt-1">
            {selectedCoupon.discountType === "PERCENT"
              ? `%${selectedCoupon.value} İndirim`
              : `${selectedCoupon.value} TL İndirim`}
          </p>
        </div>
      )}

      
      <div>
        <Label className="text-xs font-medium text-gray-700">Kupon Kodu</Label>
        <Input
          value={block.content.couponCode || ""}
          onChange={(e) => updateContent("couponCode", e.target.value)}
          placeholder="INDIRIM20"
          className="mt-1 font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          Değişken: {"{{coupon_code}}"} kullanabilirsiniz
        </p>
      </div>

      
      <div>
        <Label className="text-xs font-medium text-gray-700">
          İndirim Açıklaması
        </Label>
        <Input
          value={block.content.discountText || ""}
          onChange={(e) => updateContent("discountText", e.target.value)}
          placeholder="%20 İndirim"
          className="mt-1"
        />
      </div>

      
      <div>
        <Label className="text-xs font-medium text-gray-700">
          Geçerlilik Metni
        </Label>
        <Input
          value={block.content.validityText || ""}
          onChange={(e) => updateContent("validityText", e.target.value)}
          placeholder="30 gün geçerli"
          className="mt-1"
        />
      </div>

      
      <div>
        <Label className="text-xs font-medium text-gray-700">Border Rengi</Label>
        <Input
          type="color"
          value={block.style.borderColor || "#000000"}
          onChange={(e) => updateStyle("borderColor", e.target.value)}
          className="mt-1 h-10"
        />
      </div>

      
      <div>
        <Label className="text-xs font-medium text-gray-700">
          Arka Plan Rengi
        </Label>
        <Input
          type="color"
          value={block.style.backgroundColor || "#ffffff"}
          onChange={(e) => updateStyle("backgroundColor", e.target.value)}
          className="mt-1 h-10"
        />
      </div>
    </div>
  );
}
