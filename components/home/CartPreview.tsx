"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getGuestCartCount } from "@/lib/cart-utils";
import { useSession } from "next-auth/react";

type CartPreviewProps = {
  cartIconRef: React.RefObject<HTMLButtonElement | null>;
  headerBottom: number;
};

export default function CartPreview({ cartIconRef, headerBottom }: CartPreviewProps) {
  const [popup, setPopup] = useState<{
    product: { id: string; name: string; image: string; price: number };
    size: string;
    color: string;
  } | null>(null);
  const [position, setPosition] = useState<{ top: number; right: number }>({ top: 80, right: 20 });
  const [cartCount, setCartCount] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  // Sepet sayısını yükle
  useEffect(() => {
    const loadCartCount = async () => {
      if (!session?.user) {
        const guestCount = getGuestCartCount();
        setCartCount(guestCount);
        return;
      }
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const items = await res.json();
          const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartCount(total);
        }
      } catch (error) {
        console.error("Error loading cart count:", error);
      }
    };

    loadCartCount();
    
    const handleCartUpdate = () => {
      loadCartCount();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [session]);

  useEffect(() => {
    const handleItemAdded = (e: CustomEvent) => {
      const { product, size, color } = e.detail;
      setPopup({ product, size, color });

      // Sağ üstte sabit pozisyon (ikinci resimdeki gibi)
      setPosition({
        top: 80, // Header'dan 80px aşağı
        right: 20, // Sağdan 20px
      });

      // Sepet sayısını güncelle
      if (!session?.user) {
        setCartCount(getGuestCartCount());
      } else {
        fetch("/api/cart")
          .then((res) => res.json())
          .then((items) => {
            const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
            setCartCount(total);
          })
          .catch(() => {});
      }

      // Önceki timer'ı temizle
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // 6 saniye sonra otomatik kapat
      timerRef.current = setTimeout(() => {
        setPopup(null);
      }, 6000);
    };

    window.addEventListener("itemAddedToCart", handleItemAdded as EventListener);
    return () => {
      window.removeEventListener("itemAddedToCart", handleItemAdded as EventListener);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [session]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node)
      ) {
        setPopup(null);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      }
    };

    if (popup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [popup]);

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && popup) {
        setPopup(null);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      }
    };

    if (popup) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [popup]);

  if (!popup) return null;

  return (
    <div
      ref={popupRef}
      className="fixed bg-white rounded-lg shadow-2xl z-[9999] border border-black/10 animate-in slide-in-from-top-2 duration-200 w-[420px]"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
      }}
    >
      <div className="p-5">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#111]">Sepete Eklendi</h3>
          <button
            onClick={() => {
              setPopup(null);
              if (timerRef.current) {
                clearTimeout(timerRef.current);
              }
            }}
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Kapat"
          >
            <X className="w-4 h-4 text-[#111]" />
          </button>
        </div>

        {/* Product Info */}
        <div className="flex gap-4 mb-5">
          <div className="relative w-24 h-24 bg-gray-50 flex-shrink-0 rounded">
            <Image
              src={popup.product.image}
              alt={popup.product.name}
              fill
              className="object-contain rounded"
              sizes="96px"
              quality={85}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-light text-[#111] mb-2 line-clamp-2 leading-relaxed">
              {popup.product.name}
            </p>
            <p className="text-xs text-[#111]/60 font-light mb-2">
              {popup.size && <span>{popup.size}</span>}
              {popup.size && popup.color && <span> / </span>}
              {popup.color && <span>{popup.color}</span>}
            </p>
            <p className="text-sm font-light text-[#111]">
              ₺{popup.product.price.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              setPopup(null);
              if (timerRef.current) {
                clearTimeout(timerRef.current);
              }
              // Sepet penceresini aç
              window.dispatchEvent(new Event("openCart"));
            }}
            className="w-full px-4 py-2.5 border border-[#111] bg-white text-[#111] font-light text-xs uppercase tracking-wider hover:bg-[#111] hover:text-white transition-colors text-center"
          >
            Sepeti Görüntüle {cartCount > 0 && `(${cartCount})`}
          </button>
          <Link
            href="/payment"
            onClick={() => {
              setPopup(null);
              if (timerRef.current) {
                clearTimeout(timerRef.current);
              }
            }}
            className="w-full px-4 py-2.5 bg-[#111] text-white font-light text-xs uppercase tracking-wider hover:bg-[#333] transition-colors text-center block"
          >
            Ödeme
          </Link>
        </div>
      </div>
    </div>
  );
}
