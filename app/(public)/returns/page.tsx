import { RotateCcw, Package, Clock, CheckCircle2, AlertTriangle, ArrowRight, Truck } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "İade & Değişim | Dark Velvet",
    description: "Dark Velvet iade ve değişim koşulları, süreçleri ve politikaları hakkında bilgi.",
};

export default function ReturnsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
                        <RotateCcw className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">İade & Değişim</h1>
                    <p className="text-gray-300">Dark Velvet ile alışverişiniz güvence altında</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: <Clock className="w-6 h-6" />, title: "14 Gün İade Hakkı", desc: "Ürünü teslim aldığınız tarihten itibaren 14 gün içinde iade edebilirsiniz." },
                        { icon: <Truck className="w-6 h-6" />, title: "Ücretsiz İade Kargo", desc: "İade kargo ücretini Dark Velvet karşılar. Anlaşmalı kargo firmalarımızı kullanabilirsiniz." },
                        { icon: <RotateCcw className="w-6 h-6" />, title: "Kolay Değişim", desc: "Beden veya renk değişikliği için stok durumuna göre hızlı değişim yapılır." },
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

                
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">İade Nasıl Yapılır?</h2>
                    </div>
                    <div className="space-y-6">
                        {[
                            { step: "1", title: "Hesabınıza Giriş Yapın", desc: "Dark Velvet hesabınıza giriş yaparak 'Siparişlerim' bölümüne gidin." },
                            { step: "2", title: "İade Talebi Oluşturun", desc: "İade etmek istediğiniz ürünü ve iade nedeninizi seçerek iade talebinizi oluşturun." },
                            { step: "3", title: "Ürünü Paketleyin", desc: "Ürünü orijinal ambalajında, etiketleri sökülmemiş ve kullanılmamış şekilde paketleyin." },
                            { step: "4", title: "Kargo ile Gönderin", desc: "Size iletilen ücretsiz iade kargo kodu ile anlaşmalı kargo firmasına teslim edin." },
                            { step: "5", title: "İade Onayı & Ödeme", desc: "Ürün tarafımızca kontrol edildikten sonra ücret iade edilir. Süre: 3-7 iş günü." },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                                    {item.step}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                    <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-green-100 text-green-700">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">İade Kabul Koşulları</h2>
                    </div>
                    <ul className="space-y-3">
                        {[
                            "Ürün, teslim tarihinden itibaren 14 gün içinde iade edilmelidir.",
                            "Ürün kullanılmamış, yıkanmamış ve orijinal etiketleri üzerinde olmalıdır.",
                            "Ürün orijinal ambalajında iade edilmelidir.",
                            "Fatura veya e-fatura ile birlikte gönderilmelidir.",
                            "Kişiye özel üretilen veya kişiselleştirilen ürünler iade edilemez.",
                            "İç giyim ürünleri hijyen nedeniyle iade alınmaz.",
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                                <span className="text-gray-700">{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-red-100 text-red-700">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">İade Edilemeyecek Ürünler</h2>
                    </div>
                    <ul className="space-y-3">
                        {[
                            "Kullanılmış, yıkanmış veya hasar görmüş ürünler",
                            "Etiketleri çıkarılmış veya kesilmiş ürünler",
                            "Kişiye özel üretilen/kişiselleştirilen ürünler",
                            "Hijyen açısından iade kabul edilmeyen ürünler (iç giyim, mayo vb.)",
                            "Hediye kartları ve dijital ürünler",
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <AlertTriangle className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                                <span className="text-gray-700">{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                            <Package className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Değişim İşlemleri</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Beden veya renk değişikliği yapmak istediğinizde, ürünün stokta bulunması koşuluyla değişim işlemi gerçekleştirilir.
                        Değişim için iade kargo ücreti Dark Velvet tarafından karşılanır.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Değişim sürecinde, iade edilen ürün tarafımıza ulaştıktan sonra yeni ürün 1-3 iş günü içinde kargoya verilir.
                        Stokta bulunmaması halinde ürün bedeli iade edilir.
                    </p>
                </section>

                
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Yardıma mı ihtiyacınız var?</h3>
                    <p className="text-gray-600 mb-4">İade ve değişim süreçlerinizle ilgili destek ekibimize ulaşabilirsiniz.</p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Bize Ulaşın
                    </Link>
                </div>
            </div>
        </div>
    );
}
