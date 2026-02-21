"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";

interface CouponInputProps {
    onCouponApplied?: (couponData: any) => void;
}

export default function CouponInput({ onCouponApplied }: CouponInputProps) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const applyCoupon = useCartStore(state => state.applyCoupon);

    const handleApply = async () => {
        if (!code.trim()) return;

        setLoading(true);
        try {
            const res = await applyCoupon(code.trim());

            if (!res.success) {
                toast.error(res.message || "Kupon uygulanamadı");
                if (onCouponApplied) onCouponApplied(null);
            } else {
                toast.success(res.message || "Kupon uygulandı!");
                if (onCouponApplied) onCouponApplied(res);
                setCode(""); // Clear input on success
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
            if (onCouponApplied) onCouponApplied(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
            <h3 className="text-sm font-medium mb-2">Hediye Çeki / Kupon Kodu</h3>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Kupon Kodu"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black uppercase"
                />
                <button
                    onClick={handleApply}
                    disabled={loading || !code.trim()}
                    className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Uygula"}
                </button>
            </div>
        </div>
    );
}
