"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { dlPush } from "@/lib/ga4";
import { useCartStore } from "@/lib/stores/cartStore";

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [status, setStatus] = useState("loading"); // loading, success, failed
    const [order, setOrder] = useState<any>(null);
    const cartClearedRef = useRef(false);

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

    useEffect(() => {
        if (status !== "success" || cartClearedRef.current) return;
        cartClearedRef.current = true;
        useCartStore.getState().clearCart();
        void useCartStore.getState().refreshCart();
    }, [status]);

    if (status === "loading") {
        return (
            <section className="relative isolate min-h-[68vh] overflow-hidden px-4 py-14 sm:px-6">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-amber-50 via-white to-cyan-50" />
                <div className="pointer-events-none absolute -left-32 top-10 -z-10 h-64 w-64 rounded-full bg-amber-200/35 blur-3xl" />
                <div className="pointer-events-none absolute -right-28 bottom-8 -z-10 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />

                <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-3xl border border-slate-200/70 bg-white/80 px-8 py-12 text-center shadow-[0_30px_90px_-45px_rgba(14,116,144,0.45)] backdrop-blur">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-300/40">
                        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/35 border-t-white" />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Ödeme sonucunuz kontrol ediliyor...</h2>
                    <p className="mt-3 text-sm text-slate-500 sm:text-base">Birkaç saniye içinde sipariş durumunu doğrulayıp sizi bilgilendireceğiz.</p>
                </div>
            </section>
        );
    }

    if (status === "failed") {
        return (
            <section className="relative isolate min-h-[68vh] overflow-hidden px-4 py-14 sm:px-6">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-rose-50 via-white to-orange-50" />
                <div className="mx-auto w-full max-w-2xl rounded-3xl border border-rose-200/70 bg-white/90 px-6 py-10 text-center shadow-[0_30px_90px_-45px_rgba(190,24,93,0.35)] backdrop-blur sm:px-10">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-100 text-4xl text-rose-600">✕</div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Ödeme Başarısız</h1>
                    <p className="mx-auto mt-3 max-w-lg text-slate-600">İşleminiz sırasında bir hata oluştu. Lütfen ödeme adımını yeniden deneyin.</p>
                    <Link
                        href="/checkout"
                        className="mt-8 inline-flex items-center justify-center rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                        Tekrar Dene
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="relative isolate min-h-[68vh] overflow-hidden px-4 py-14 sm:px-6">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-orange-50 via-white to-emerald-50" />
            <div className="pointer-events-none absolute -left-24 top-8 -z-10 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-10 -z-10 h-80 w-80 rounded-full bg-emerald-200/35 blur-3xl" />

            <div className="mx-auto w-full max-w-3xl rounded-4xl border border-emerald-100/90 bg-white/85 p-6 shadow-[0_45px_120px_-60px_rgba(22,163,74,0.45)] backdrop-blur sm:p-10">
                <div className="grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="text-center md:text-left">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 text-4xl text-white shadow-lg shadow-emerald-300/45 animate-[fadeIn_0.5s_ease-out_forwards]">
                            ✓
                        </div>
                        <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl animate-[fadeIn_0.65s_ease-out_forwards]">Siparişiniz Alındı!</h1>
                        <p className="mt-3 text-base text-slate-600 sm:text-lg animate-[fadeIn_0.75s_ease-out_forwards]">
                            Ödemeniz onaylandı. Siparişiniz hazırlanırken gelişmeleri anlık olarak takip edebilirsiniz.
                        </p>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row animate-[fadeIn_0.85s_ease-out_forwards]">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                                Alışverişe Devam Et
                            </Link>
                            <Link
                                href="/profile/orders"
                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                            >
                                Siparişlerim
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-slate-50 to-white p-5 text-center shadow-inner animate-[fadeIn_0.9s_ease-out_forwards] md:text-left">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sipariş Numarası</p>
                        <p className="mt-2 break-all font-mono text-lg font-bold text-slate-900 sm:text-xl">{order?.orderNo}</p>
                        <div className="my-4 h-px bg-linear-to-r from-transparent via-slate-300 to-transparent" />
                        <p className="text-sm text-slate-600">Sipariş detaylarını profilinizdeki siparişler sayfasından görüntüleyebilirsiniz.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="relative isolate flex min-h-[68vh] flex-col items-center justify-center overflow-hidden px-4 py-14">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-amber-50 via-white to-cyan-50" />
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-cyan-200 border-t-cyan-600" />
                <div className="mt-4 h-2 w-28 overflow-hidden rounded-full bg-cyan-100">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-500" />
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
