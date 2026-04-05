"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type GridColor = {
  id: string;
  name: string;
  hexCode?: string | null;
  image?: string | null;
  variantCode?: string | null;
};

type GridProduct = {
  id: string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  primaryImage?: string | null;
  image?: string | null;
  colors: GridColor[];
};

type Props = {
  products: GridProduct[];
};

type SelectedColorState = {
  colorId: string;
  image?: string | null;
  variantCode?: string | null;
};

export default function CollectionDetailProductsGrid({ products }: Props) {
  const [hoveredColor, setHoveredColor] = useState<Record<string, SelectedColorState | undefined>>({});
  const [selectedColor, setSelectedColor] = useState<Record<string, SelectedColorState | undefined>>({});

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
      {products.map((product) => {
        const hovered = hoveredColor[product.id];
        const selected = selectedColor[product.id];

        const displayImage =
          hovered?.image ||
          selected?.image ||
          product.primaryImage ||
          product.image ||
          "/placeholder.jpg";

        const productHref = product.slug ? `/products/${product.slug}` : `/product/${product.id}`;
        const variantCode = selected?.variantCode || product.colors?.[0]?.variantCode;
        const finalHref = variantCode ? `${productHref}?variant=${variantCode}` : productHref;

        return (
          <Link key={product.id} href={finalHref} className="group">
            <div className="relative aspect-3/4 overflow-hidden bg-gray-50 mb-6 group-hover:shadow-2xl transition-all duration-700">
              <Image
                src={displayImage}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {product.originalPrice && product.originalPrice > product.price && (
                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[10px] uppercase font-bold tracking-widest">
                  INDIRIM
                </div>
              )}

              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                <span className="text-white text-[11px] font-bold tracking-[0.3em] uppercase border-b border-white pb-1">Incele</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-sm font-light text-black/80 group-hover:text-black transition-colors uppercase tracking-wide truncate">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-base font-medium">{product.price.toLocaleString("tr-TR")} TL</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-black/30 line-through">
                    {product.originalPrice.toLocaleString("tr-TR")} TL
                  </span>
                )}
              </div>

              {product.colors && product.colors.length > 0 && (
                <div className="flex gap-1.5 pt-1">
                  {product.colors.slice(0, 6).map((color) => {
                    const isSelected = selected?.colorId === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onMouseEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setHoveredColor((prev) => ({
                            ...prev,
                            [product.id]: {
                              colorId: color.id,
                              image: color.image,
                              variantCode: color.variantCode,
                            },
                          }));
                        }}
                        onMouseLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setHoveredColor((prev) => ({ ...prev, [product.id]: undefined }));
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedColor((prev) => ({
                            ...prev,
                            [product.id]: {
                              colorId: color.id,
                              image: color.image,
                              variantCode: color.variantCode,
                            },
                          }));
                        }}
                        className={`w-2.5 h-2.5 rounded-full border transition-all ${isSelected ? "border-black scale-110" : "border-black/10"}`}
                        style={{ backgroundColor: color.hexCode || "#ccc" }}
                        aria-label={`${color.name} renk secenegi`}
                      />
                    );
                  })}
                  {product.colors.length > 6 && (
                    <span className="text-[10px] text-black/30">+{product.colors.length - 6}</span>
                  )}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
