"use client";

import { Block } from "../../types";

interface CouponBlockProps {
  block: Block;
}

export default function CouponBlock({ block }: CouponBlockProps) {
  const couponCode = block.content.couponCode || "{{coupon_code}}";
  const validityText = block.content.validityText || "1 ay geçerli";
  const discountText = block.content.discountText || "";
  const borderColor = block.style.borderColor || "#000000";
  const backgroundColor = block.style.backgroundColor || "#ffffff";

  return (
    <div className="p-8 text-center" style={{ backgroundColor }}>
      <div
        className="inline-block border-2 p-6 rounded-lg"
        style={{ borderColor }}
      >
        {discountText && (
          <p className="text-lg font-bold mb-2" style={{ color: borderColor }}>
            {discountText}
          </p>
        )}
        <p className="text-sm text-gray-600 mb-2">İndirim Kodu</p>
        <p
          className="text-2xl font-mono font-bold mb-2 px-4 py-2 bg-gray-100 rounded"
          style={{ color: borderColor }}
        >
          {couponCode}
        </p>
        <p className="text-xs text-gray-500 mt-2">{validityText}</p>
      </div>
    </div>
  );
}
