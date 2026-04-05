"use client";

import { useState } from "react";
import { Search, Package, Truck, MapPin, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TrackPage() {
    const [trackingNumber, setTrackingNumber] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber.trim()) {
            setError("LÃ¼tfen sipariÅŸ numaranÄ±zÄ± veya kargo takip numaranÄ±zÄ± giriniz.");
            return;
        }
        setError("");
        window.open(`https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${trackingNumber}`, "_blank");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
                        <Truck className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">SipariÅŸimi Takip Et</h1>
                    <p className="text-gray-300">SipariÅŸ numaranÄ±z veya kargo takip numaranÄ±z ile sipariÅŸinizi takip edin</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
                {/* Arama Formu */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                        <label htmlFor="tracking" className="block text-sm font-medium text-gray-700 mb-2">
                            SipariÅŸ veya Kargo Takip NumarasÄ±
                        </label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="tracking"
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => { setTrackingNumber(e.target.value); setError(""); }}
                                    placeholder="Ã–rn: DV2026021234 veya 3300012345678"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium whitespace-nowrap"
                            >
                                Sorgula
                            </button>
                        </div>
                        {error && (
                            <p className="mt-3 text-red-500 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </p>
                        )}
                    </form>
                </section>

                {/* SipariÅŸ DurumlarÄ± */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">SipariÅŸ DurumlarÄ±</h2>
                    <div className="space-y-4">
                        {[
                            { icon: <Clock className="w-5 h-5" />, status: "SipariÅŸ AlÄ±ndÄ±", desc: "SipariÅŸiniz baÅŸarÄ±yla oluÅŸturuldu ve onay bekliyor.", color: "bg-blue-100 text-blue-700" },
                            { icon: <CheckCircle2 className="w-5 h-5" />, status: "HazÄ±rlanÄ±yor", desc: "SipariÅŸiniz depomuzda hazÄ±rlanÄ±yor.", color: "bg-yellow-100 text-yellow-700" },
                            { icon: <Package className="w-5 h-5" />, status: "Kargoya Verildi", desc: "SipariÅŸiniz kargo firmasÄ±na teslim edildi.", color: "bg-orange-100 text-orange-700" },
                            { icon: <Truck className="w-5 h-5" />, status: "Yolda", desc: "SipariÅŸiniz daÄŸÄ±tÄ±m aÅŸamasÄ±nda.", color: "bg-purple-100 text-purple-700" },
                            { icon: <MapPin className="w-5 h-5" />, status: "Teslim Edildi", desc: "SipariÅŸiniz baÅŸarÄ±yla teslim edildi.", color: "bg-green-100 text-green-700" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className={`p-2 rounded-lg ${item.color}`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{item.status}</h4>
                                    <p className="text-gray-600 text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Ãœye GiriÅŸi */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">HesabÄ±nÄ±zdan Takip Edin</h2>
                    <p className="text-gray-600 mb-6">
                        Dark Velvet hesabÄ±nÄ±za giriÅŸ yaparak tÃ¼m sipariÅŸlerinizi detaylÄ± olarak takip edebilirsiniz.
                    </p>
                    <Link
                        href="/profile/orders"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                    >
                        <Package className="w-4 h-4" />
                        SipariÅŸlerim
                    </Link>
                </section>

                {/* Destek */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">SipariÅŸinizle ilgili bir sorun mu var?</h3>
                    <p className="text-gray-600 mb-4">Destek ekibimiz size yardÄ±mcÄ± olmaktan mutluluk duyar.</p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Bize UlaÅŸÄ±n
                    </Link>
                </div>
            </div>
        </div>
    );
}
