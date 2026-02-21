import { Truck, Clock, Package, MapPin, CreditCard, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Kargo Politikaları | Dark Velvet",
    description: "Dark Velvet kargo süreleri, teslimat koşulları ve ücretsiz kargo bilgileri.",
};

export default function ShippingPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
                        <Truck className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Kargo Politikaları</h1>
                    <p className="text-gray-300">Siparişlerinize hızlı ve güvenli teslimat</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
                {/* Öne Çıkanlar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: <CreditCard className="w-6 h-6" />, title: "999₺ Üzeri Ücretsiz Kargo", desc: "999₺ ve üzeri alışverişlerinizde kargo ücretsizdir." },
                        { icon: <Clock className="w-6 h-6" />, title: "1-3 İş Günü Teslimat", desc: "Siparişleriniz iş günlerinde ortalama 1-3 iş günü içinde teslim edilir." },
                        { icon: <MapPin className="w-6 h-6" />, title: "Türkiye Geneli Teslimat", desc: "Türkiye'nin her yerine güvenli ve hızlı teslimat yapıyoruz." },
                    ].map((item, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4 text-gray-800">
                                {item.icon}
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                            <p className="text-gray-600 text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Kargo Ücretleri */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                            <Package className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Kargo Ücretleri</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="py-3 px-4 text-sm font-semibold text-gray-900">Sipariş Tutarı</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-gray-900">Standart Kargo</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-gray-900">Hızlı Kargo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 px-4 text-gray-700">0₺ – 998₺</td>
                                    <td className="py-3 px-4 text-gray-700">49,90₺</td>
                                    <td className="py-3 px-4 text-gray-700">79,90₺</td>
                                </tr>
                                <tr className="bg-green-50">
                                    <td className="py-3 px-4 text-gray-700 font-medium">999₺ ve üzeri</td>
                                    <td className="py-3 px-4 text-green-700 font-medium">Ücretsiz</td>
                                    <td className="py-3 px-4 text-gray-700">29,90₺</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Teslimat Süreleri */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-green-100 text-green-700">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Teslimat Süreleri</h2>
                    </div>
                    <ul className="space-y-4">
                        {[
                            { title: "İstanbul İçi", time: "1-2 iş günü", note: "Saat 14:00'e kadar verilen siparişler aynı gün kargoya verilir." },
                            { title: "Büyükşehirler", time: "2-3 iş günü", note: "Ankara, İzmir, Bursa, Antalya ve diğer büyükşehirler." },
                            { title: "Diğer İller", time: "3-5 iş günü", note: "Kırsal bölgelerde teslimat süreleri uzayabilir." },
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-20 text-center shrink-0">
                                    <span className="text-lg font-bold text-gray-900">{item.time}</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                    <p className="text-gray-600 text-sm mt-1">{item.note}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Dikkat Edilmesi Gerekenler */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Önemli Bilgiler</h2>
                    </div>
                    <ul className="space-y-3">
                        {[
                            "Siparişleriniz, ödemenin onaylanmasının ardından hazırlanmaya başlar.",
                            "Hafta sonu ve resmi tatillerde verilen siparişler ilk iş günü işleme alınır.",
                            "Kargo teslim alınırken paket durumunu mutlaka kontrol ediniz.",
                            "Hasarlı gelen paketler için kargo görevlisine tutanak düzenlettirilebilir.",
                            "Adres bilgilerinizin doğruluğu, teslimat süresini doğrudan etkiler.",
                            "Kampanya dönemlerinde teslimat süreleri uzayabilir.",
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <CheckCircle2 className="w-4 h-4 text-orange-500 mt-1 shrink-0" />
                                <span className="text-gray-700">{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Anlaşmalı Kargo */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                            <Truck className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Anlaşmalı Kargo Firmaları</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Dark Velvet olarak hızlı ve güvenli teslimat için Türkiye&apos;nin önde gelen kargo firmalarıyla çalışmaktayız.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo"].map((name, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                                <span className="font-medium text-gray-800">{name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Destek */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Kargonuzla ilgili sorunuz mu var?</h3>
                    <p className="text-gray-600 mb-4">
                        Siparişinizi takip etmek veya kargo ile ilgili destek almak için bize ulaşabilirsiniz.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/track"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                        >
                            <Package className="w-4 h-4" />
                            Siparişimi Takip Et
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                        >
                            <HelpCircle className="w-4 h-4" />
                            Bize Ulaşın
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
