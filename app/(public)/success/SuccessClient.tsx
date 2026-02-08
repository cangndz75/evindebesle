"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCartStore } from "@/lib/stores/cartStore";
import { CheckCircle, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function SuccessClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");
    const { clearCart } = useCartStore();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Clear the cart immediately upon landing on success page
        clearCart();

        // Fire confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        // Auto redirect countdown
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (orderId) {
                        router.push(`/profile/orders/product/${orderId}`);
                    } else {
                        router.push("/profile/orders");
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    }, [clearCart, router, orderId]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-bounce">
                <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-4xl font-serif mb-4">Siparişiniz Alındı!</h1>
            <p className="text-gray-600 max-w-md mb-8 text-lg">
                Siparişiniz başarıyla oluşturuldu. Sipariş numaranız ile sipariş takibi yapabilirsiniz.
            </p>

            {orderId && (
                <div className="bg-gray-50 px-6 py-3 rounded-lg border border-gray-200 mb-8">
                    <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Sipariş No</p>
                    <p className="font-mono font-bold text-xl">{orderId}</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button
                    variant="outline"
                    className="flex-1 py-6 text-base"
                    onClick={() => router.push("/")}
                >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Alışverişe Dön
                </Button>

                <Button
                    className="flex-1 py-6 text-base bg-black hover:bg-gray-800"
                    onClick={() => orderId ? router.push(`/profile/orders/product/${orderId}`) : router.push("/profile/orders")}
                >
                    Sipariş Detayı
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>

            <p className="mt-8 text-sm text-gray-400">
                {countdown} saniye içinde sipariş detayına yönlendirileceksiniz...
            </p>
        </div>
    );
}
