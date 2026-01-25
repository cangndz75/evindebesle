"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function FailureContent() {
    const searchParams = useSearchParams();
    // const orderId = searchParams.get("orderId");

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="text-red-500 text-6xl mb-4">!</div>
            <h1 className="text-3xl font-bold mb-2">Ödeme Alınamadı</h1>
            <p className="text-gray-600 mb-8">
                Kartınızdan ödeme alınırken bir sorun oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyin.
            </p>
            <div className="flex gap-4">
                <Link href="/checkout" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                    Tekrar Dene
                </Link>
                <Link href="/" className="text-gray-600 hover:text-black border px-6 py-2 rounded border-gray-300">
                    Anasayfa
                </Link>
            </div>
        </div>
    );
}

export default function CheckoutFailurePage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <FailureContent />
        </Suspense>
    );
}
