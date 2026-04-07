"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { dlPush } from "@/lib/ga4";

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [status, setStatus] = useState("loading"); // loading, success, failed
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (!orderId) {
            setStatus("error");
            return;
        }

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}/payment`);
                const data = await res.json();

                if (res.ok) {
                    setOrder(data);
                    if (data.paymentStatus === "SUCCEEDED" || data.orderStatus === "PAID") {
                        setStatus("success");
                        const sentKey = `ga4_sent_${orderId}`;
                        if (!localStorage.getItem(sentKey)) {
                            dlPush("purchase", {
                                transaction_id: data.orderNo,
                                value: data.total,
                                currency: "TRY",
                                items: data.items.map((item: any) => ({
                                    item_id: item.productId,
                                    item_name: item.productName,
                                    price: item.unitPrice,
                                    quantity: item.quantity,
                                    item_variant: `${item.colorName || ""} ${item.sizeName || ""}`.trim()
                                }))
                            });
                            localStorage.setItem(sentKey, "true");
                        }
                    } else if (data.paymentStatus === "FAILED") {
                        setStatus("failed");
                    } else {
                        setTimeout(checkStatus, 3000);
                    }
                } else {
                    setStatus("error");
                }
            } catch (e) {
                console.error(e);
                setStatus("error");
            }
        };

        checkStatus();
    }, [orderId]);

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h2 className="text-xl font-medium">Ödeme sonucunuz kontrol ediliyor...</h2>
            </div>
        );
    }

    if (status === "failed") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="text-red-500 text-6xl mb-4">✕</div>
                <h1 className="text-3xl font-bold mb-2">Ödeme Başarısız</h1>
                <p className="text-gray-600 mb-8">İşleminiz sırasında bir hata oluştu. Lütfen tekrar deneyin.</p>
                <Link href="/checkout" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                    Tekrar Dene
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h1 className="text-3xl font-bold mb-2">Siparişiniz Alındı!</h1>
            <p className="text-gray-600 mb-8">
                Sipariş numaranız: <span className="font-mono font-bold text-black">{order?.orderNo}</span>
            </p>
            <div className="flex gap-4">
                <Link href="/" className="text-blue-600 hover:underline">
                    Alışverişe Devam Et
                </Link>
                <Link href="/profile/orders" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                    Siparişlerim
                </Link>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <div className="h-2 w-24 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-blue-600 animate-pulse" />
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
