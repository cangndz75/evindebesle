"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/stores/cartStore";
import Link from "next/link";
import Image from "next/image";
import CouponInput from "@/components/checkout/CouponInput";
import UpsellSection from "@/components/checkout/UpsellSection";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CheckoutSummaryPage() {
    const { items, removeItem, updateQuantity } = useCartStore();
    const [coupon, setCoupon] = useState<any>(null);
    const router = useRouter();

    const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const shipping = subtotal >= 999 ? 0 : 25; // Example logic, sync with server
    const discount = coupon ? coupon.discountAmount : 0;
    const total = subtotal + shipping - discount;

    const handleApplyCoupon = (couponData: any) => {
        setCoupon(couponData);
    };

    const handleProceed = () => {
        // Navigate to checkout with coupon code if exists
        if (coupon) {
            router.push(`/checkout?coupon=${coupon.code}`);
        } else {
            router.push("/checkout");
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen pt-32 pb-16 bg-gray-50 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-light mb-4">Sepetiniz Boş</h1>
                <Link href="/" className="bg-black text-white px-6 py-3 rounded text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors">
                    Alışverişe Başla
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-[120px] pb-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <h1 className="text-2xl md:text-3xl font-serif font-light mb-8">Sepetim ({items.length})</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            {items.map((item) => (
                                <div key={`${item.productId}-${item.colorId}-${item.sizeId}`} className="flex gap-4 py-4 border-b last:border-0 border-gray-100">
                                    <div className="relative w-24 h-32 bg-gray-100 flex-shrink-0">
                                        <Image
                                            src={item.product.image || "/placeholder.png"}
                                            alt={item.product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Link href={`/product/${item.product.id}`} className="text-base font-medium text-black hover:underline">
                                                    {item.product.name}
                                                </Link>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {item.size?.name} {item.color?.name && `• ${item.color.name}`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-end mt-4">
                                            <div className="flex items-center border border-gray-200 rounded">
                                                <button
                                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                    className="px-3 py-1 hover:bg-gray-50"
                                                >
                                                    -
                                                </button>
                                                <span className="px-2 text-sm">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="px-3 py-1 hover:bg-gray-50"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <p className="font-medium text-lg">{item.product.price * item.quantity} ₺</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Upsell Section */}
                        <UpsellSection />
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
                            <h2 className="text-lg font-semibold mb-4">Sipariş Özeti</h2>
                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Ara Toplam</span>
                                    <span>{subtotal.toFixed(2)} ₺</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Kargo</span>
                                    <span>{shipping === 0 ? "Ücretsiz" : `${shipping.toFixed(2)} ₺`}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>İndirim ({coupon?.code})</span>
                                        <span>-{discount.toFixed(2)} ₺</span>
                                    </div>
                                )}
                                <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg text-black">
                                    <span>Toplam</span>
                                    <span>{total.toFixed(2)} ₺</span>
                                </div>
                            </div>

                            <CouponInput onCouponApplied={handleApplyCoupon} subtotal={subtotal} />

                            <button
                                onClick={handleProceed}
                                className="w-full bg-[#2da85c] text-white py-4 rounded-lg mt-6 font-semibold shadow-lg hover:bg-[#258a4d] transition-colors uppercase tracking-wide text-sm"
                            >
                                Alışverişi Tamamla
                            </button>

                            <div className="mt-4 p-3 bg-purple-50 text-purple-700 text-xs rounded border border-purple-100">
                                Ücretsiz kargo hakkı kazanmanıza {(999 - subtotal).toFixed(2)} TL kaldı!
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
