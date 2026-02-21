import { FileText, Shield, Gavel, Handshake, AlertCircle, Clock } from "lucide-react";

export const metadata = {
    title: "Kullanım Koşulları | Dark Velvet",
    description: "Dark Velvet web sitesi kullanım koşulları ve üyelik sözleşmesi.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Kullanım Koşulları</h1>
                    <p className="text-gray-300">Dark Velvet dİjital platformları kullanım ve üyelik şartları</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
                {/* Giriş */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                            <Handshake className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">1. Genel Kabul</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                        Bu web sitesine erişerek ve kullanarak, aşağıda belirtilen kullanım koşullarını, yasal şartları ve gizlilik politikamızı hiçbir sınırlama olmaksızın kabul etmiş sayılırsınız. <strong>Dark Velvet</strong> (Bundan sonra &quot;Şirket&quot; olarak anılacaktır), bu koşulları dilediği zaman önceden haber vermeksizin güncelleme hakkını saklı tutar.
                    </p>
                </section>

                {/* Üyelik ve Hesap */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">2. Üyelik ve Hesap Güvenliği</h2>
                    </div>
                    <ul className="space-y-3">
                        {[
                            "Siteye üye olurken verilen bilgilerin doğruluğu ve güncelliği üyenin sorumluluğundadır.",
                            "Hesap şifresinin gizliliği ve güvenliği tamamen kullanıcıya aittir. Şifrenin üçüncü kişilerle paylaşılması yasaktır.",
                            "Kullanıcı, hesabında gerçekleşen tüm işlemlerden bizzat sorumludur.",
                            "Dark Velvet, güvenlik şüphesi durumunda kullanıcı hesaplarını askıya alma veya sonlandırma hakkına sahiptir.",
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-gray-700">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Ürün ve Fiyatlandırma */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-green-100 text-green-700">
                            <Gavel className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">3. Ürünler ve Satış Koşulları</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Dark Velvet, sitede yer alan ürünlerin stok durumlarını ve fiyatlarını dilediği zaman değiştirme hakkına sahiptir. Olası teknik hatalardan kaynaklanan fiyat yanlışlıklarında, Şirket siparişi iptal etme veya müşteriye doğru fiyatı bildirme hakkını saklı tutar.
                    </p>
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                            <p className="text-sm text-amber-800 font-medium">
                                Ürün görselleri ile orijinal ürünler arasında ekran çözünürlüğü ve ışık farkından kaynaklanan minimal renk sapmaları görülebilir.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Fikri Mülkiyet */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">4. Fikri Mülkiyet Hakları</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                        Bu sitede yer alan her türlü içerik (logo, tasarım, görsel, metin, yazılım vb.) Dark Velvet&apos;e ait olup, ulusal ve uluslararası telif hakları yasalarıyla korunmaktadır. Şirketin yazılı izni olmaksızın bu içeriklerin kısmen veya tamamen kopyalanması, çoğaltılması veya dağıtılması yasaktır.
                    </p>
                </section>

                {/* Sorumluluk Sınırlandırması */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-red-100 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">5. Sorumluluk Sınırlandırması</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                        Dark Velvet, sitenin kesintisiz çalışacağını veya virüs içermeyeceğini garanti etmez. Sitenin kullanımından kaynaklanabilecek dolaylı veya dolaysız hiçbir zarardan Şirket sorumlu tutulamaz. Dış bağlantılar üzerinden erişilen üçüncü taraf sitelerin içeriklerinden Şirketimizin sorumluluğu bulunmamaktadır.
                    </p>
                </section>

                {/* Kapanış ve Tarih */}
                <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-500 mb-4">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-widest font-bold">Son Güncelleme</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">22 Şubat 2026</p>
                    <p className="text-gray-600 mt-2 max-w-lg mx-auto">
                        Bu koşullar hakkında sorularınız için bizimle <a href="mailto:info@darkvelvet.com" className="text-indigo-600 font-bold hover:underline">iletişime</a> geçebilirsiniz.
                    </p>
                </section>
            </div>
        </div>
    );
}
